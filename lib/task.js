/*
 * lib/task.js
 */

'use strict';

var assert = require('assert');

var _ = require('lodash'),
    async = require('async'),
    redis = require('redis');

var C = require('./constant'),
    helper = require('./helper');

function Task(bbq, type, data) {
  this._bbq = bbq;
  this._client = null;
  this._data = data;
  this._attempts = C.DEFAULT_TASK_ATTEMPTS;
  this._priority = C.PRIORITY.NORMAL;
  this._progress = 0;
  this._saved = false;
  this._state = C.STATE.ACTIVE;
  this._type = type;
  this._onConnectListeners = [];
}

Task.prototype._connect = function (cb) {
  var self = this,
      config = self._bbq._config,
      client;

  if (!self._client && config.client) {
    self._client = config.client;
  }

  if (self._client) {
    client = self._client;
    if (!client.connected) {
      return self._onConnectListeners.push(cb);
    }
    return cb(null, client);
  }

  client = self._client = redis.createClient(config.port, config.host);

  if (config.password) {
    client.auth(config.password, function (err) {
      if (err) {
        client.end();
        return cb(err);
      }
    });
  }

  if (_.isFunction(cb)) {
    self._onConnectListeners.push(cb);
  }

  client.once('connect', function () {
    self._onConnectListeners.forEach(function (cb) {
      cb(null, client);
    });
    self._onConnectListeners.length = 0;
  });
};

Task.prototype._disconnect = function (cb) {
  if (!this._client && !this._client.connected) {
    return cb();
  }

  if (!this._bbq._config.client) {
    this._client.quit();
  }

  cb();
};

Task.prototype.priority = function (priority) {
  assert(_.isString(priority) || (_.isNumber(priority) && priority === parseInt(priority, 10)),
         '"priority" must be either string or an integer.');

  if (_.isString(priority)) {
    assert(_.has(C.PRIORITY, priority.toUpperCase()), 'Unknown task priority - ' + priority);
    priority = C.PRIORITY[priority.toUpperCase()];
  }

  this._priority = priority;

  return this;
};

Task.prototype.attempts = function (attempts) {
  assert(_.isNumber(attempts) && (parseInt(attempts, 10) === attempts),
         '"attempts" must be an integer.');

  this._attempts = attempts;

  return this;
};

Task.prototype.save = function (cb) {
  var self = this,
      builder = self._bbq._builder;

  if (self._saved) {
    return cb(new Error('Task already saved.'));
  }

  self._connect(function (err, client) {
    if (err) { return cb(err); }

    async.series([
      function (cb) {
        var currentTime = Date.now();

        var task = {
          id: helper.genId(),
          state: self._state,
          type: self._type,
          data: self._data,
          priority: self._priority,
          attempts: self._attempts,
          progress: self._progress,
          createdAt: currentTime,
          updatedAt: currentTime,
          worker: '',
          duration: -1,
          result: {}
        };

        if (_.isUndefined(task.data)) {
          task.data = {};
        }

        client
          .MULTI()
          .HMSET(
            builder.taskKey(task.id),
            'state', task.state,
            'type', task.type,
            'data', JSON.stringify(task.data),
            'priority', task.priority,
            'attempts', task.attempts,
            'progress', task.progress,
            'createdAt', task.createdAt,
            'updatedAt', task.updatedAt,
            'worker', task.worker,
            'duration', task.duration,
            'result', JSON.stringify(task.result)
          )
          .ZADD(
            builder.stateActiveKey(task.type),
            builder.stateScore(task.priority, task.createdAt),
            task.id
          )
          .PUBLISH(
            builder.stateChangeChannel(),
            JSON.stringify(_.pick(task, 'id', 'type', 'state', 'createdAt', 'updatedAt'))
          )
          .EXEC(function (err, result) {
            if (err) { return cb(err); }
            if (_.isEmpty(result)) {
              return cb(new Error('Failed to schedule a task.'));
            }
            cb();
          });
      },
      function (cb) {
        self._disconnect(cb);
      },
      function (cb) {
        self._saved = true;
        cb();
      }
    ], cb);
  });
};

// Public API
exports = module.exports = Task;
