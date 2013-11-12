/*
 * lib/builder.js
 */

'use strict';

var assert = require('assert'),
    util = require('util');

var _ = require('lodash');

var C = require('./constant');

function Builder(namespace, prefix) {
  if (!_.isEmpty(namespace)) {
    this._prefix = util.format('%s:%s', namespace.replace(/:+$/, ''), prefix);
  } else {
    this._prefix = prefix;
  }
}

Builder.prototype.statusActiveKey = function (type) {
  assert(_.isString(type) && !_.isEmpty(type), 'Type must be non-empty string.');

  return util.format('%s:%s:%s', this._prefix, C.STATUS.ACTIVE, type);
};

Builder.prototype.statusCompleteKey = function (type) {
  assert(_.isString(type) && !_.isEmpty(type), 'Type must be non-empty string.');

  return util.format('%s:%s:%s', this._prefix, C.STATUS.COMPLETE, type);
};

Builder.prototype.statusFailedKey = function (type) {
  assert(_.isString(type) && !_.isEmpty(type), 'Type must be non-empty string.');

  return util.format('%s:%s:%s', this._prefix, C.STATUS.FAILED, type);
};

Builder.prototype.statusInactiveKey = function (type) {
  assert(_.isString(type) && !_.isEmpty(type), 'Type must be non-empty string.');

  return util.format('%s:%s:%s', this._prefix, C.STATUS.INACTIVE, type);
};

Builder.prototype.statusProcessingKey = function (type) {
  assert(_.isString(type) && !_.isEmpty(type), 'Type must be non-empty string.');

  return util.format('%s:%s:%s', this._prefix, C.STATUS.PROCESSING, type);
};

Builder.prototype.statusScore = function (priority, timestamp) {
  assert(_.isNumber(priority) && priority === parseInt(priority, 10), 'Priority must be an integer.');
  assert(_.isNumber(timestamp) && timestamp === parseInt(timestamp, 10), 'Timestamp must be an integer.');

  return util.format('%d.%d', priority, timestamp);
};

Builder.prototype.statusUpdateChannel = function () {
  return util.format('%s:update', this._prefix);
};

Builder.prototype.taskKey = function (taskId) {
  assert(_.isString(taskId) && !_.isEmpty(taskId), 'Task ID must be non-empty string.');

  return util.format('%s:task:%s', this._prefix, taskId);
};

Builder.prototype.tempKey = function (tempId) {
  assert(_.isString(tempId) && !_.isEmpty(tempId), 'Temp ID must be non-empty string.');

  return util.format('%s:temp:%s', this._prefix, tempId);
};

Builder.prototype.workerName = function (workerId) {
  assert(_.isString(workerId) && !_.isEmpty(workerId), 'Worker ID must be non-empty string.');

  return util.format('%s:worker:pub:%s', this._prefix, workerId);
};

Builder.prototype.workerSubName = function (workerId) {
  assert(_.isString(workerId) && !_.isEmpty(workerId), 'Worker ID must be non-empty string.');

  return util.format('%s:worker:sub:%s', this._prefix, workerId);
};

// Public API
exports = module.exports = Builder;
