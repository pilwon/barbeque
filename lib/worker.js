/*
 * lib/worker.js
 */

'use strict';

var assert = require('assert'),
    util = require('util');

var _ = require('lodash'),
    async = require('async'),
    redis = require('redis');

var C = require('./constant'),
    helper = require('./helper');

function Worker(bbq) {
  this._bbq = bbq;
  this._clientPub = null;
  this._clientSub = null;
  this._id = helper.genId();
  this._isListener = false;
  this._processing = false;
  this._watchlist = {};
  this._onConnectPubListeners = [];
  this._onConnectSubListeners = [];
}

Worker.prototype._connectPub = function (cb) {
  var self = this,
      builder = self._bbq._builder,
      config = self._bbq._config,
      client;

  if (!self._clientPub && config.client) {
    self._clientPub = config.client;
  }

  if (self._clientPub) {
    client = self._clientPub;
    if (!client.connected) {
      return self._onConnectPubListeners.push(cb);
    }
    return cb(null, client);
  }

  client = self._clientPub = redis.createClient(config.port, config.host);

  if (config.password) {
    client.auth(config.password, function (err) {
      if (err) {
        client.end();
        return cb(err);
      }
    });
  }

  if (_.isFunction(cb)) {
    self._onConnectPubListeners.push(cb);
  }

  client.once('connect', function () {
    client.CLIENT('SETNAME', builder.workerName(self._id), function () {
      self._onConnectPubListeners.forEach(function (cb) {
        cb(null, client);
      });
      self._onConnectPubListeners.length = 0;
    });
  });
};

Worker.prototype._connectSub = function (cb) {
  var self = this,
      builder = self._bbq._builder,
      config = self._bbq._config,
      client;

  if (self._clientSub) {
    client = self._clientSub;
    if (!client.connected) {
      return self._onConnectSubListeners.push(cb);
    }
    return cb(null, client);
  }

  client = self._clientSub = redis.createClient(config.port, config.host);

  if (config.password) {
    client.auth(config.password, function (err) {
      if (err) {
        client.end();
        return cb(err);
      }
    });
  }

  if (_.isFunction(cb)) {
    self._onConnectSubListeners.push(cb);
  }

  client.on('message', function () {
    self._onMessage.apply(self, arguments);
  });

  client.once('connect', function () {
    client.CLIENT('SETNAME', builder.workerSubName(self._id), function () {
      self._onConnectSubListeners.forEach(function (cb) {
        cb(null, client);
      });
      self._onConnectSubListeners.length = 0;
    });

    client.SUBSCRIBE(builder.stateChangeChannel(), function (err) {
      if (err) { return cb(err); }
    });
  });
};

Worker.prototype._disconnectPub = function (cb) {
  if (!this._clientPub && !this._clientPub.connected) {
    return cb();
  }

  if (!this._bbq._config.client) {
    this._clientPub.quit();
  }

  cb();
};

Worker.prototype._disconnectSub = function (cb) {
  if (!this._clientSub && !this._clientSub.connected) {
    return cb();
  }

  this._clientSub.quit();

  cb();
};

Worker.prototype._fetchTask = function (client, taskId, cb) {
  var self = this,
      task;

  client.HGETALL(self._bbq._builder.taskKey(taskId), function (err, result) {
    if (err) { return cb(err); }

    task = result;
    task.id = taskId;
    task.data = JSON.parse(task.data);
    task.priority = parseInt(task.priority, 10);
    task.attempts = parseInt(task.attempts, 10);
    task.progress = parseFloat(task.progress);
    task.createdAt = parseInt(task.createdAt, 10);
    task.updatedAt = parseInt(task.updatedAt, 10);

    cb(null, task);
  });
};

Worker.prototype._onMessage = function (channel, message) {
  var self = this,
      builder = self._bbq._builder;

  if (channel === builder.stateChangeChannel()) {
    self._onStateChange(JSON.parse(message));
  }
};

Worker.prototype._onStateChange = function (task) {
  var self = this;

  if (this._isListener) {
    return self._bbq.emit(task.state, task);
  }

  if (!_.has(self._watchlist, task.type)) { return; }

  if (task.state === C.STATE.ACTIVE) {
    self._bbq.emit('active', task);
    self._stateChangeActiveToProcessing();
  }
};

Worker.prototype._process = function (task, score, cb) {
  var self = this,
      fn = self._watchlist[task.type],
      startTime = Date.now();

  try {
    fn({
      id: task.id,
      type: task.type,
      data: task.data,
      priority: task.priority,
      attempts: task.attempts,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      worker: task.worker,
      // extra
      create: create,
      log: log,
      progress: progress
    }, function (err, result) {
      var duration = Date.now() - startTime;

      if (err) {
        if (!(err instanceof Error)) {
          try {
            throw new Error('err must be an instance of Error.');
          } catch (err) {
            self._bbq.emit('error', err);
          }
        } else {
          self._bbq.emit('error', err);
        }

        // TODO: Support attempts feature.

        self._stateChangeProcessingToFailed(task, score, duration, err.message, result);
      } else {
        self._stateChangeProcessingToComplete(task, score, duration, result);
      }

      cb();
    });
  } catch (err) {
    self._bbq.emit('error', err);

    var duration = Date.now() - startTime;
    self._stateChangeProcessingToFailed(task, score, duration, err.message);

    cb();
  }

  function create() {
    return self._bbq.create.apply(self._bbq, arguments);
  }

  function log() {
    var msg = util.format.apply(null, arguments);

    // TODO: Update DB

    self._bbq.emit('log', task, msg);
  }

  function progress(completed, total) {
    var percent = completed / total * 100;

    // TODO: Update DB

    self._bbq.emit('progress', task, percent);
  }
};

Worker.prototype._stateChangeActiveToProcessing = function () {
  var self = this,
      builder = self._bbq._builder,
      client,
      task,
      taskId,
      taskScore;

  if (self._processing) { return; }

  self._processing = true;

  async.series([
    function (cb) {
      self._connectPub(function (err, result) {
        client = result;
        cb.apply(this, arguments);
      });
    },
    function (cb) {
      var tempKey = builder.tempKey();
      var zunionstoreArgs = [
        tempKey,
        _.size(self._watchlist)
      ];
      _.each(self._watchlist, function (fn, type) {
        zunionstoreArgs.push(builder.stateActiveKey(type));
      });
      client
        .MULTI()
        .ZUNIONSTORE(zunionstoreArgs)
        .ZRANGE(tempKey, 0, 0, 'WITHSCORES')
        .DEL(tempKey)
        .EXEC(function (err, result) {
          if (err) { return cb(err); }
          if (_.isEmpty(result) || _.isEmpty(result[1])) {
            // Active task not found. STOP.
            self._processing = false;
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
      self._fetchTask(client, taskId, function (err, result) {
        if (err) { return cb(err); }
        task = result;
        cb();
      });
    },
    function (cb) {
      _.assign(task, {
        state: C.STATE.PROCESSING,
        updatedAt: Date.now(),
        worker: self._id
      });

      client
        .MULTI()
        .ZREM(builder.stateActiveKey(task.type), taskId)
        .ZADD(builder.stateProcessingKey(task.type), taskScore, taskId)
        .HMSET([
          builder.taskKey(taskId),
          'state', task.state,
          'updatedAt', task.updatedAt,
          'worker', task.worker
        ])
        .PUBLISH([
          builder.stateChangeChannel(),
          JSON.stringify(_.pick(task, 'id', 'type', 'state', 'createdAt', 'updatedAt', 'worker'))
        ])
        .EXEC(function (err, result) {
          if (err) { return cb(err); }
          if (_.isEmpty(result)) {
            // Task state could not change from "active" to "processing.
            // Try again. The next time a different task id will be chosen if exists.
            self._processing = false;
            return self._stateChangeActiveToProcessing();
          }
          cb();
        });
    },
    function (cb) {
      self._bbq.emit('processing', task);
      cb();
    },
    function (cb) {
      self._process(task, taskScore, cb);
    }
  ], function (err) {
    self._processing = false;
    if (err) {
      return console.error(err.message);
    } else {
      self._stateChangeActiveToProcessing();
    }
  });
};

Worker.prototype._stateChangeProcessingToComplete = function (task, score, duration, result) {
  var self = this,
      builder = self._bbq._builder,
      client;

  async.series([
    function (cb) {
      self._connectPub(function (err, result) {
        client = result;
        cb.apply(this, arguments);
      });
    },
    function (cb) {
      client.WATCH(builder.taskKey(task.id), cb);
    },
    function (cb) {
      self._fetchTask(client, task.id, function (err, fetchedTask) {
        if (err) { return cb(err); }
        task = fetchedTask;
        cb();
      });
    },
    function (cb) {
      _.assign(task, {
        state: C.STATE.COMPLETE,
        updatedAt: Date.now(),
        worker: self._id,
        duration: duration,
        result: result
      });

      client
        .MULTI()
        .ZREM(builder.stateProcessingKey(task.type), task.id)
        .ZADD(builder.stateCompleteKey(task.type), score, task.id)
        .HMSET([
          builder.taskKey(task.id),
          'state', task.state,
          'updatedAt', task.updatedAt,
          'worker', task.worker,
          'duration', task.duration,
          'result', JSON.stringify(task.result)
        ])
        .PUBLISH([
          builder.stateChangeChannel(),
          JSON.stringify(_.pick(task, 'id', 'type', 'state', 'createdAt', 'updatedAt', 'worker', 'duration', 'result'))
        ])
        .EXEC(function (err, result) {
          if (err) { return cb(err); }
          if (_.isEmpty(result)) {
            // Task state could not change from "processing" to "complete". Try again.
            // return self._stateChangeProcessingToComplete(task, score, duration, result);
          }
          cb();
        });
    },
    function (cb) {
      self._bbq.emit('complete', task);
      cb();
    }
  ], function (err) {
    if (err) { return console.error(err.message); }
  });
};

Worker.prototype._stateChangeProcessingToFailed = function (task, score, duration, errMsg, errResult) {
  var self = this,
      builder = self._bbq._builder,
      client;

  async.series([
    function (cb) {
      self._connectPub(function (err, result) {
        client = result;
        cb.apply(this, arguments);
      });
    },
    function (cb) {
      client.WATCH(builder.taskKey(task.id), cb);
    },
    function (cb) {
      self._fetchTask(client, task.id, function (err, fetchedTask) {
        if (err) { return cb(err); }
        task = fetchedTask;
        cb();
      });
    },
    function (cb) {
      _.assign(task, {
        state: C.STATE.FAILED,
        updatedAt: Date.now(),
        worker: self._id,
        duration: duration,
        result: {
          error: errMsg,
          result: errResult
        }
      });

      client
        .MULTI()
        .ZREM(builder.stateProcessingKey(task.type), task.id)
        .ZADD(builder.stateFailedKey(task.type), score, task.id)
        .HMSET([
          builder.taskKey(task.id),
          'state', task.state,
          'updatedAt', task.updatedAt,
          'worker', task.worker,
          'duration', task.duration,
          'result', JSON.stringify(task.result)
        ])
        .PUBLISH([
          builder.stateChangeChannel(),
          JSON.stringify(_.pick(task, 'id', 'type', 'state', 'createdAt', 'updatedAt', 'worker', 'duration', 'result'))
        ])
        .EXEC(function (err, result) {
          if (err) { return cb(err); }
          if (_.isEmpty(result)) {
            // Task state could not change from "processing" to "failed". Try again.
            // return self._stateChangeProcessingToFailed(task, score, duration, errMsg, errResult);
          }
          cb();
        });
    },
    function (cb) {
      self._bbq.emit('failed', task);
      cb();
    }
  ], function (err) {
    if (err) { return console.error(err.message); }
  });
};

Worker.prototype.listen = function () {
  var self = this;

  this._isListener = true;

  self._connectSub();
};

Worker.prototype.watch = function (type, fn, skipProcess) {
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
    if (!skipProcess) {
      self._stateChangeActiveToProcessing();
    }
  });
};

// Public API
exports = module.exports = Worker;
