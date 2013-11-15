/*
 * lib/index.js
 */

'use strict';

var assert = require('assert'),
    events = require('events'),
    util = require('util');

var _ = require('lodash');

var C = require('./constant'),
    builder = require('./builder'),
    helper = require('./helper'),
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
  this._builder = new builder(config.namespace, config.prefix);
  this._worker = new worker(this);
}

util.inherits(Barbeque, events.EventEmitter);

  assert(_.isString(type), 'Task type must be a string.');
Barbeque.prototype.create = function (type, data) {

  return new task(this, type, data || {});
};

Barbeque.prototype.process = function (type, fn) {
  assert(_.isString(type), 'type must be a string.');
  assert(_.isFunction(fn), 'fn must be a function.');

  this._worker.watch(type, fn);

  return this;
};

Barbeque.prototype.processAll = function (multiLevelObject) {
  assert(_.isObject(multiLevelObject), 'Multi-level object must be an object type.');

  var self = this,
      flattenObject = helper.flattenDot(multiLevelObject),
      n = _.size(flattenObject);

  _.each(_.keys(flattenObject), function (type, i) {
    var fn = flattenObject[type],
        skipProcess = (i + 1 < n);

    assert(_.isString(type), 'type must be a string.');
    assert(_.isFunction(fn), 'fn must be a function (type: ' + type + ')');

    self._worker.watch(type, fn, skipProcess);
  });
};

// Public API
exports = module.exports = Barbeque;
