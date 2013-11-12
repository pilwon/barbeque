/*
 * lib/task.js
 */

'use strict';

var assert = require('assert');

var _ = require('lodash'),
    async = require('async'),
    redis = require('redis'),
    uuid = require('uuid');

var C = require('./constant');

function Task(bbq, type, data) {
  this._bbq = bbq;
  this._client = null;
  this._task = {
    id: null,
    type: type,
    data: data,
    priority: null,
    status: C.STATUS.ACTIVE
  };

  this.priority('normal');
}

Task.prototype._connect = function (cb) {
  var config = this._bbq._config;

  if (this._client && this._client.connected) {
    return cb(null, this._client);
  }

  var client = this._client = redis.createClient(config.port, config.host);

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

  this._task.priority = priority;

  return this;
};

Task.prototype.save = function (cb) {
  var self = this,
      builder = self._bbq._builder,
      task = self._task;

  task.id = uuid.v4();

  this._connect(function (err, client) {
    if (err) { return cb(err); }

    async.series([
      function (cb) {
        var currentTime = Date.now();
        client
          .MULTI()
          .HMSET(
            builder.taskKey(task.id),
            'status', task.status,
            'type', task.type,
            'data', JSON.stringify(task.data),
            'priority', task.priority,
            'createdAt', currentTime,
            'updatedAt', currentTime
          )
          .ZADD(builder.statusActiveKey(task.type), builder.statusScore(task.priority, currentTime), task.id)
          .PUBLISH(builder.statusUpdateChannel(), JSON.stringify(_.omit(task, 'data')))
          .EXEC(cb);
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