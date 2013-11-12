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

    client.SUBSCRIBE(builder.stateUpdateChannel(), function (err) {
      if (err) { return cb(err); }
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

Worker.prototype._fetchTask = function (client, taskId, taskScore, cb) {
  var self = this,
      task;

  client.HGETALL(self._bbq._builder.taskKey(taskId), function (err, result) {
    if (err) { return cb(err); }

    task = result;
    task.id = taskId;
    task.score = parseFloat(taskScore);
    task.data = JSON.parse(task.data);
    task.priority = parseInt(task.priority, 10);
    task.createdAt = new Date(parseInt(task.createdAt, 10));
    task.updatedAt = new Date(parseInt(task.updatedAt, 10));

    cb(null, task);
  });
};

Worker.prototype._onMessage = function (channel, message) {
  var self = this,
      builder = self._bbq._builder;

  if (channel === builder.stateUpdateChannel()) {
    if (self._processing) { return; }
    self._onTaskUpdate(JSON.parse(message));
  }
};

Worker.prototype._onTaskUpdate = function (task) {
  if (!_.has(this._watchlist, task.type)) { return; }
  this._stateUpdateActiveToProcessing();
};

Worker.prototype._process = function (task) {
  var self = this;

  self._processing = true;

  self._watchlist[task.type](task, function (err, result) {
    if (err) {
      self._stateUpdateProcessingToFailed(task, err, result);
    } else {
      self._stateUpdateProcessingToComplete(task, result);
    }
    self._processing = false;

    process.nextTick(function () {
      self._stateUpdateActiveToProcessing();
    });
  });
};

Worker.prototype._stateUpdateActiveToProcessing = function () {
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
          args.push(builder.stateActiveKey(type));
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
        self._fetchTask(client, taskId, taskScore, function (err, result) {
          if (err) { return cb(err); }
          task = result;
          task.result = self._id;
          cb();
        });
      },
      function (cb) {
        client
          .MULTI()
          .ZREM(builder.stateActiveKey(task.type), taskId)
          .ZADD(builder.stateProcessingKey(task.type), taskScore, taskId)
          .HSET(builder.taskKey(taskId), 'state', C.STATE.PROCESSING)
          .PUBLISH([
            builder.stateUpdateChannel(),
            JSON.stringify(_.assign(_.pick(task, 'id', 'type', 'state'), {
              worker: self._id
            }))
          ])
          .EXEC(function (err, result) {
            if (err) { return cb(err); }
            if (_.isEmpty(result)) {
              // Task state could not change from "active" to "processing.
              // Try again. The next time a different task id will be chosen if exists.
              return process.nextTick(function () {
                self._stateUpdateActiveToProcessing();
              });
            }
            cb();
          });
      },
      function () {
        self._process(task);
      }
    ], function (err) {
      if (err) { return console.error(err.message); }
    });
  }
};

Worker.prototype._stateUpdateProcessingToComplete = function (task, result) {
  var self = this,
      builder = self._bbq._builder;

  self._connectPub(function (err, client) {
    if (err) { return console.error(err.message); }

    async.series([
      function (cb) {
        client.WATCH(builder.taskKey(task.id), cb);
      },
      function (cb) {
        self._fetchTask(client, task.id, task.score, function (err, result) {
          if (err) { return cb(err) };
          task = result;
          cb();
        });
      },
      function (cb) {
        client
          .MULTI()
          .ZREM(builder.stateProcessingKey(task.type), task.id)
          .ZADD(builder.stateCompleteKey(task.type), task.score, task.id)
          .HMSET([
            builder.taskKey(task.id),
            'state', C.STATE.COMPLETE,
            'result', JSON.stringify(result)
          ])
          .PUBLISH([
            builder.stateUpdateChannel(),
            JSON.stringify(_.assign(_.pick(task, 'id', 'type', 'state'), {
              worker: self._id,
              result: result
            }))
          ])
          .EXEC(function (err, result) {
            if (err) { return cb(err); }
            if (_.isEmpty(result)) {
              // Task state could not change from "active" to "processing.
              // Try again. The next time a different task id will be chosen if exists.
              return process.nextTick(function () {
                self._stateUpdateActiveToProcessing();
              });
            }
            cb();
          });
      }
    ], function (err) {
      if (err) { return console.error(err.message); }
    });
  });
};

Worker.prototype._stateUpdateProcessingToFailed = function (task, err, data) {
  var self = this,
      builder = self._bbq._builder;

  self._connectPub(function (err, client) {
    if (err) { return console.error(err.message); }

    async.series([
      function (cb) {
        client.WATCH(builder.taskKey(task.id), cb);
      },
      function (cb) {
        self._fetchTask(client, task.id, task.score, function (err, result) {
          if (err) { return cb(err) };
          task = result;
          ;
          cb();
        });
      },
      function (cb) {
        var result = {
          error: err.message,
          data: data
        };

        client
          .MULTI()
          .ZREM(builder.stateProcessingKey(task.type), task.id)
          .ZADD(builder.stateFailedKey(task.type), task.score, task.id)
          .HMSET([
            builder.taskKey(task.id),
            'state', C.STATE.FAILED,
            'result', JSON.stringify(result),
          ])
          .PUBLISH([
            builder.stateUpdateChannel(),
            JSON.stringify(_.assign(_.pick(task, 'id', 'type', 'state'), {
              worker: self._id,
              result: result
            }))
          ])
          .EXEC(function (err, result) {
            if (err) { return cb(err); }
            if (_.isEmpty(result)) {
              // Task state could not change from "active" to "processing.
              // Try again. The next time a different task id will be chosen if exists.
              return process.nextTick(function () {
                self._stateUpdateActiveToProcessing();
              });
            }
            cb();
          });
      }
    ], function (err) {
      if (err) { return console.error(err.message); }
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
    if (err) { return console.error(err.message); }
    self._stateUpdateActiveToProcessing();
  });
};

// Public API
exports = module.exports = Worker;
