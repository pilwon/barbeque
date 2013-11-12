/*
 * lib/worker.js
 */

'use strict';

var assert = require('assert');

var _ = require('lodash'),
    async = require('async'),
    redis = require('redis'),
    uuid = require('uuid');

var C = require('./constant');

function Worker(bbq) {
  this._bbq = bbq;
  this._clientPub = null;
  this._clientSub = null;
  this._id = uuid.v4();
  this._processing = false;
  this._watchlist = {};
}

Worker.prototype._connectPub = function (cb) {
  var self = this,
      builder = this._bbq._builder,
      config = this._bbq._config;

  if (this._clientPub && this._clientPub.connected) {
    return cb(null, this._clientPub);
  }

  var client = this._clientPub = redis.createClient(config.port, config.host);

  if (config.password) {
    client.auth(config.password, function (err) {
      if (err) {
        client.end();
        return cb(err);
      }
    });
  }

  client.once('connect', function () {
    client.CLIENT('SETNAME', builder.workerName(self._id), function () {
      cb(null, client);
    });
  });
};

Worker.prototype._connectSub = function (cb) {
  var self = this,
      builder = self._bbq._builder,
      config = this._bbq._config;

  if (this._clientSub && this._clientSub.connected) {
    return cb(null, this._clientSub);
  }

  var client = this._clientSub = redis.createClient(config.port, config.host);

  if (config.password) {
    client.auth(config.password, function (err) {
      if (err) {
        client.end();
        return cb(err);
      }
    });
  }

  client.once('connect', function () {
    client.CLIENT('SETNAME', builder.workerSubName(self._id), function () {
      cb(null, client);
    });

    client.SUBSCRIBE(builder.statusUpdateChannel(), function (err) {
      if (err) { return console.error(err); }
    });
  });

  client.on('message', function () {
    self._onMessage.apply(self, arguments);
  });
};

Worker.prototype._disconnectPub = function (cb) {
  if (!this._clientPub && !this._clientPub.connected) {
    return cb();
  }

  this._clientPub.quit();

  cb();
};

Worker.prototype._disconnectSub = function (cb) {
  if (!this._clientSub && !this._clientSub.connected) {
    return cb();
  }

  this._clientSub.quit();

  cb();
};

Worker.prototype._onMessage = function (channel, message) {
  var self = this,
      builder = self._bbq._builder;

  if (channel === builder.statusUpdateChannel()) {
    if (self._processing) { return; }
    self._onTaskUpdate(JSON.parse(message));
  }
};

Worker.prototype._onProcessComplete = function (task, result) {
  console.log(result);
};

Worker.prototype._onProcessFailed = function (task, err, result) {
  console.error(err.message, result);
};

Worker.prototype._onTaskUpdate = function (task) {
  if (!_.has(this._watchlist, task.type)) { return; }
  this._process();
};

Worker.prototype._process = function () {
  var self = this,
      builder = self._bbq._builder,
      client,
      task,
      taskId,
      taskScore;

  if (!self._processing) {
    async.series([
      function (cb) {
        self._connectPub(function (err, result) {
          client = result;
          cb.apply(this, arguments);
        });
      },
      function (cb) {
        var args = [
          builder.tempKey(self._id),
          _.size(self._watchlist)
        ];
        _.each(self._watchlist, function (fn, type) {
          args.push(builder.statusActiveKey(type));
        });
        client
          .MULTI()
          .ZUNIONSTORE(args)
          .ZRANGE(builder.tempKey(self._id), 0, 0, 'WITHSCORES')
          .DEL(builder.tempKey(self._id))
          .EXEC(function (err, result) {
            if (err) { return cb(err); }
            if (_.isEmpty(result) || _.isEmpty(result[1])) {
              // Active task not found. STOP.
              return;
            }
            taskId = result[1][0];
            taskScore = result[1][1];
            cb();
          });
      },
      function (cb) {
        client.WATCH(builder.taskKey(taskId), cb);
      },
      function (cb) {
        client.HGETALL(builder.taskKey(taskId), function (err, result) {
          if (err) { return cb(err); }

          task = result;
          task.id = taskId;
          task.score = parseFloat(taskScore);
          task.data = JSON.parse(task.data);
          task.createdAt = new Date(parseInt(task.createdAt, 10));
          task.updatedAt = new Date(parseInt(task.updatedAt, 10));
          task.priority = parseInt(task.priority, 10);

          cb();
        });
      },
      function (cb) {
        client
          .MULTI()
          .ZREM(builder.statusActiveKey(task.type), taskId)
          .ZADD(builder.statusProcessingKey(task.type), taskScore, taskId)
          .HSET(builder.taskKey(taskId), 'status', C.STATUS.PROCESSING)
          .PUBLISH(builder.statusUpdateChannel(), JSON.stringify(_.omit(task, 'data')))
          .EXEC(function (err, result) {
            if (err) { return cb(err); }
            if (_.isEmpty(result)) {
              // Task status could not change from "active" to "processing.
              // Try again. The next time a different task id will be chosen if exists.
              return process.nextTick(function () {
                self._process();
              });
            }
            cb();
          });
      },
      function () {
        self._processTask(task);
      }
    ], function (err) {
      if (err) { return console.error(err); }
    });
  }
};

Worker.prototype._processTask = function (task) {
  var self = this;

  self._processing = true;

  self._watchlist[task.type](task, function (err, result) {
    if (err) {
      self._onProcessFailed(task, err, result);
    } else {
      self._onProcessComplete(task, result);
    }
    self._processing = false;

    process.nextTick(function () {
      self._process();
    });
  });
};

Worker.prototype.watch = function (type, fn) {
  assert(!_.has(this._watchlist, type), 'Already watching - ' + type);

  var self = this;

  self._watchlist[type] = fn;

  async.parallel([
    function (cb) {
      self._connectPub(cb);
    },
    function (cb) {
      self._connectSub(cb);
    }
  ], function (err) {
    if (err) { return console.error(err); }
    self._process();
  });
};

// Public API
exports = module.exports = Worker;
