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
  this._priority = C.PRIORITY.NORMAL;
  this._state = C.STATE.ACTIVE;
  this._type = type;
}

Task.prototype._connect = function (cb) {
  var config = this._bbq._config,
      client;

  if (this._client) {
    client = this._client;
    if (!client.connected) {
      return client.once('connect', function () {
        cb(null, client);
      });
    }
    return cb(null, client);
  }

  client = this._client = redis.createClient(config.port, config.host);

  if (config.password) {
    client.auth(config.password, function (err) {
      if (err) {
        client.end();
        return cb(err);
      }
    });
  }

  client.once('connect', function () {
    cb(null, client);
  });
};

Task.prototype._disconnect = function (cb) {
  if (!this._client && !this._client.connected) {
    return cb();
  }

  this._client.quit();

  cb();
};

Task.prototype.priority = function (priority) {
  assert(_.isString(priority) || (_.isNumber(priority) && priority === parseInt(priority, 10)),
    'Task priority must be either string or an integer.'
  );

  if (_.isString(priority)) {
    assert(_.has(C.PRIORITY, priority.toUpperCase()), 'Unknown task priority - ' + priority);
    priority = C.PRIORITY[priority.toUpperCase()];
  }

  this._priority = priority;

  return this;
};

Task.prototype.save = function (cb) {
  var self = this,
      builder = self._bbq._builder;

  this._connect(function (err, client) {
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
          createdAt: currentTime,
          updatedAt: currentTime,
          worker: '',
          duration: -1,
          result: {}
        };

        client
          .MULTI()
          .HMSET(
            builder.taskKey(task.id),
            'state', task.state,
            'type', task.type,
            'data', JSON.stringify(task.data),
            'priority', task.priority,
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
      }
    ], cb);
  });

  return this;
};

// Public API
exports = module.exports = Task;
