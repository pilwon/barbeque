/*
 * lib/index.js
 */

'use strict';

var assert = require('assert');

var _ = require('lodash');

var C = require('./constant'),
    helper = require('./builder'),
    task = require('./task'),
    worker = require('./worker');

function Barbeque(config) {
  assert(_.isPlainObject(config) || _.isEmpty(config), 'Config must be a plain object.');
  assert(_.isString(config.host) || _.isEmpty(config.host), 'Host must be a string.');
  assert(_.isNumber(config.port) || _.isEmpty(config.port), 'Port must be an integer.');
  assert(_.isString(config.password) || _.isEmpty(config.password), 'Password must be a string.');
  assert(_.isString(config.namespace) || _.isEmpty(config.namespace), 'Namespace must be a string.');
  assert(_.isString(config.prefix) || _.isEmpty(config.prefix), 'Prefix must be a string.');

  if (_.isEmpty(config)) { config = {}; }
  if (_.isEmpty(config.host)) { config.host = C.DEFAULT_HOST; }
  if (_.isEmpty(config.port)) { config.port = C.DEFAULT_PORT; }
  if (_.isEmpty(config.password)) { config.password = C.DEFAULT_PASSWORD; }
  if (_.isEmpty(config.namespace)) { config.namespace = C.DEFAULT_NAMESPACE; }
  if (_.isEmpty(config.prefix)) { config.prefix = C.DEFAULT_PREFIX; }

  this._config = config;
  this._builder = new helper(config.namespace, config.prefix);
  this._worker = new worker(this);
}

Barbeque.prototype.task = function (type, data) {
  assert(_.isString(type), 'Task type must be a string.');

  return new task(this, type, data || {});
};

Barbeque.prototype.process = function (type, fn) {
  assert(_.isString(type) && _.isFunction(fn), 'Invalid process() params.');

  this._worker.watch(type, fn);

  return this;
};

// Public API
exports = module.exports = Barbeque;
