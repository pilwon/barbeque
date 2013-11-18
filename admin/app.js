/*
 * admin/app.js
 */

'use strict';

var assert = require('assert'),
    http = require('http'),
    util = require('util');

var _ = require('lodash'),
    express = require('express');

var DEFAULT_HOST = 'localhost',
    DEFAULT_PORT = 3000,
    DEFAULT_PATH = '/',
    DEFAULT_NAMESPACE = null,
    STATIC_DIR = __dirname + '/static';

function App(options, cb) {
  if (_.isUndefined(options)) { options = {}; }

  assert(_.isString(options.host) || _.isUndefined(options.host),
         '"host" must be a string or undefined.');
  assert(_.isNumber(options.port) || _.isUndefined(options.port),
         '"port" must be a number or undefined.');
  assert(_.isString(options.path) || _.isUndefined(options.path),
         '"path" must be a string or undefined.');
  assert(_.isString(options.namespace) || _.isUndefined(options.namespace),
         '"namespace" must be a string or undefined.');

  if (!_.isFunction(cb) || _.isUndefined(cb)) {
    cb = function () {};
  }

  _.defaults(options, {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    path: DEFAULT_PATH,
    namespace: DEFAULT_NAMESPACE
  });

  // Path should not start or end with a slash.
  options.path = options.path.replace(/^\/+/, '').replace(/\/+$/, '');

  this._app = null;
  this._bbq = null;

  this._runServer(options.host, options.port, options.path, cb);
  this._subscribeBBQEvents(options.namespace);
}

App.prototype._attachMiddleware = function (app, prefix) {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use((require('less-middleware'))({
    src: '/less',
    dest: '/css',
    root: STATIC_DIR
  }));
  app.use(prefix + '/bower_components', express.static(STATIC_DIR + '/js/node_modules/bower_components'));
  app.use(prefix + '/css', express.static(STATIC_DIR + '/css'));
  app.use(prefix + '/img', express.static(STATIC_DIR + '/img'));
  app.use(prefix + '/tpl/layout', express.static(STATIC_DIR + '/js/layout/templates'));
  app.use(prefix + '/tpl/main', express.static(STATIC_DIR + '/js/main/templates'));
  app.use(prefix + '/tpl/task', express.static(STATIC_DIR + '/js/task/templates'));
  app.use(prefix + '/js/app.js', (require('browserify-middleware'))(STATIC_DIR + '/js/index.js'));

  if ('development' === app.get('env')) {
    app.use(express.errorHandler());
  }
};

App.prototype._attachRoutes = function (app, prefix) {
  app.get(prefix || '/', function (req, res) {
    res.render('index');
  });
};

App.prototype._subscribeBBQEvents = function (namespace) {
  var self = this;

  self._bbq = new (require('..'))({
    namespace: namespace
  }).on('active', function (task) {
    self._socketio.onStateChange(task);
  }).on('processing', function (task) {
    self._socketio.onStateChange(task);
  }).on('complete', function (task) {
    self._socketio.onStateChange(task);
  }).on('failed', function (task) {
    self._socketio.onStateChange(task);
  }).on('inactive', function (task) {
    self._socketio.onStateChange(task);
  }).listen();
};

App.prototype._runServer = function (host, port, path, cb) {
  var app = this._app = express(),
      server = http.createServer(app),
      io = (require('socket.io')).listen(server);

  this._attachMiddleware(app, path);
  this._attachRoutes(app, path);
  this._socketio = new (require('./socketio'))(this, io);

  server.listen(port, host, function (err) {
    if (err) { return cb(err); }
    cb(null, util.format('http://%s:%d%s', host, port, path));
  });
};

// Public API
exports = module.exports = App;
