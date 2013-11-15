/*
 * lib/builder.js
 */

'use strict';

var assert = require('assert'),
    util = require('util');

var _ = require('lodash');

var C = require('./constant'),
    helper = require('./helper');

function Builder(namespace, prefix) {
  if (!_.isEmpty(namespace)) {
    this._prefix = util.format('%s:%s', namespace.replace(/:+$/, ''), prefix);
  } else {
    this._prefix = prefix;
  }
}

Builder.prototype.stateActiveKey = function (type) {
  assert(_.isString(type) && !_.isEmpty(type), '"type" must be a non-empty string.');

  return util.format('%s:state:%s:%s', this._prefix, C.STATE.ACTIVE, type);
};

Builder.prototype.stateCompleteKey = function (type) {
  assert(_.isString(type) && !_.isEmpty(type), '"type" must be a non-empty string.');

  return util.format('%s:state:%s:%s', this._prefix, C.STATE.COMPLETE, type);
};

Builder.prototype.stateFailedKey = function (type) {
  assert(_.isString(type) && !_.isEmpty(type), '"type" must be a non-empty string.');

  return util.format('%s:state:%s:%s', this._prefix, C.STATE.FAILED, type);
};

Builder.prototype.stateInactiveKey = function (type) {
  assert(_.isString(type) && !_.isEmpty(type), '"type" must be a non-empty string.');

  return util.format('%s:state:%s:%s', this._prefix, C.STATE.INACTIVE, type);
};

Builder.prototype.stateProcessingKey = function (type) {
  assert(_.isString(type) && !_.isEmpty(type), '"type" must be a non-empty string.');

  return util.format('%s:state:%s:%s', this._prefix, C.STATE.PROCESSING, type);
};

Builder.prototype.stateScore = function (priority, timestamp) {
  assert(_.isNumber(priority) && priority === parseInt(priority, 10), '"priority" must be an integer.');
  assert(_.isNumber(timestamp) && timestamp === parseInt(timestamp, 10), '"timestamp" must be an integer.');

  return util.format('%d.%d', priority, timestamp);
};

Builder.prototype.stateChangeChannel = function () {
  return util.format('%s:state:change', this._prefix);
};

Builder.prototype.taskKey = function (taskId) {
  assert(_.isString(taskId) && !_.isEmpty(taskId), '"taskId" must be a non-empty string.');

  return util.format('%s:task:%s', this._prefix, taskId);
};

Builder.prototype.tempKey = function () {
  return util.format('%s:temp:%s', this._prefix, helper.genId());
};

Builder.prototype.workerName = function (workerId) {
  assert(_.isString(workerId) && !_.isEmpty(workerId), '"workerId" must be a non-empty string.');

  return util.format('%s:worker:pub:%s', this._prefix, workerId);
};

Builder.prototype.workerSubName = function (workerId) {
  assert(_.isString(workerId) && !_.isEmpty(workerId), '"workerId" must be a non-empty string.');

  return util.format('%s:worker:sub:%s', this._prefix, workerId);
};

// Public API
exports = module.exports = Builder;
