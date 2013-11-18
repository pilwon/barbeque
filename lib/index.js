/*
 * lib/index.js
 */

'use strict';

var assert = require('assert'),
    events = require('events'),
    util = require('util');

var _ = require('lodash');

var C = require('./constant');

function Barbeque(config) {
  assert(_.isPlainObject(config) || _.isUndefined(config),
         '"config" must be a plain object or undefined.');

  if (_.isUndefined(config)) { config = {}; }

  assert((_.isString(config.host) && !_.isEmpty(config.host)) || _.isUndefined(config.host),
         '"config.host" must be a non-empty string or undefined.');
  assert((_.isNumber(config.port) && (parseInt(config.port, 10) === config.port)) || _.isUndefined(config.port),
         '"config.port" must be an integer or undefined.');
  assert((_.isString(config.password) && !_.isEmpty(config.password)) || _.isNull(config.password) || _.isUndefined(config.password),
         '"config.password" must be a non-empty string or null/undefined.');
  assert((_.isString(config.namespace) && !_.isEmpty(config.namespace)) || _.isNull(config.namespace) || _.isUndefined(config.namespace),
         '"config.namespace" must be a non-empty string or null/undefined.');
  assert((_.isString(config.prefix) && !_.isEmpty(config.prefix)) || _.isUndefined(config.prefix),
         '"config.prefix" must be a non-empty string or undefined.');

  if (_.isEmpty(config)) { config = {}; }
  if (_.isEmpty(config.host)) { config.host = C.DEFAULT_HOST; }
  if (_.isEmpty(config.port)) { config.port = C.DEFAULT_PORT; }
  if (_.isEmpty(config.password)) { config.password = C.DEFAULT_PASSWORD; }
  if (_.isEmpty(config.namespace)) { config.namespace = C.DEFAULT_NAMESPACE; }
  if (_.isEmpty(config.prefix)) { config.prefix = C.DEFAULT_PREFIX; }

  this._config = config;
  this._builder = new (require('./builder'))(config.namespace, config.prefix);
  this._worker = new (require('./worker'))(this);
}

util.inherits(Barbeque, events.EventEmitter);

Barbeque.prototype.admin = function (options, cb) {
  assert(_.isObject(options) || _.isUndefined(options), '"options" must be an object or undefined.');
  assert(_.isFunction(cb) || _.isUndefined(cb), '"cb" must be a function or undefined.')

  return new (require('../admin'))(options, cb);
};

Barbeque.prototype.create = function (type, data) {
  assert(_.isString(type) && !_.isEmpty(type), '"type" must be a non-empty string.');

  return new (require('./task'))(this, type, data);
};

Barbeque.prototype.listen = function () {
  if (!this._worker) {
    this._worker = new (require('./worker'))(this);
  }

  this._worker.listen();

  return this;
};

Barbeque.prototype.process = function (type, fn) {
  assert(_.isString(type) && !_.isEmpty(type), '"type" must be a non-empty string.');
  assert(_.isFunction(fn), '"fn" must be a function.');

  this._worker.watch(type, fn);

  return this;
};

Barbeque.prototype.processAll = function (nestableObject) {
  assert(_.isObject(nestableObject), '"nestableObject" must be an object type.');

  var self = this,
      flattenObject = require('./helper').flattenDot(nestableObject),
      n = _.size(flattenObject);

  _.each(_.keys(flattenObject), function (type, i) {
    var fn = flattenObject[type],
        skipProcess = (i + 1 < n);

    assert(_.isString(type) && !_.isEmpty(type), '"type" must be a non-empty string.');
    assert(_.isFunction(fn), '"fn" must be a function (type: ' + type + ')');

    self._worker.watch(type, fn, skipProcess);
  });

  return this;
};

Barbeque.prototype.run = function (fn, data, cb) {
  assert(_.isFunction(fn), '"fn" must be a funciton.');

  var self = this,
      currentTime = new Date();

  fn({
    id: null,
    type: null,
    data: data,
    createdAt: currentTime,
    updatedAt: currentTime,
    // extra
    create: create,
    log: log,
    progress: progress
  }, cb);

  function create() {
    return self.create.apply(self, arguments);
  }

  function log() {
    console.info('[LOG] ' + util.format.apply(null, arguments));
  }

  function progress(completed, total) {
    console.info('[PROGRESS] %s of %s', completed, total);
  }
};

// Public API
exports = module.exports = Barbeque;
