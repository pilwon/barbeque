/*
 * admin/socketio.js
 */

'use strict';

var TASK_DETAIL_CHANNEL = 'task:detail',
    TASK_LIST_CHANNEL = 'task:list',
    TASK_UPDATE_CHANNEL = 'task:update';

function Socket(app, io, socket) {
  this._app = app;
  this._io = io;
  this._socket = socket;

  this._addListeners();
}

Socket.prototype._addListeners = function () {
  var self = this;

  self._socket
    .on(TASK_DETAIL_CHANNEL, function (taskId) {
      self.sendTask(taskId);
    })
    .on(TASK_LIST_CHANNEL, function () {
      self.sendAllTasks();
    })
    .on(TASK_UPDATE_CHANNEL, function (task) {
      self.updateTask(task);
    });
};

Socket.prototype._emit = function () {
  this._socket.emit.apply(this._socket, arguments);
};

Socket.prototype.sendTask = function (taskId) {
  var self = this;

  self._app._bbq.query({
    id: taskId
  }, function (err, task) {
    self._emit(TASK_DETAIL_CHANNEL, err && err.message, task);
  });
};

Socket.prototype.sendAllTasks = function () {
  var self = this;

  self._app._bbq.query({}, function (err, tasks) {
    self._emit(TASK_LIST_CHANNEL, err && err.message, tasks);
  });
};

Socket.prototype.updateTask = function (task) {
  var self = this;

  self._app._bbq.update(task.id, task, function (err, success) {
    self._emit(TASK_UPDATE_CHANNEL, err && err.message, task);
  });
};

function Socketio(app, io) {
  this._app = app;
  this._io = io;

  io.sockets.on('connection', function (socket) {
    new Socket(app, io, socket);
  });
}

Socketio.prototype.onStateChange = function (task) {
  this._io.sockets.emit(TASK_UPDATE_CHANNEL, null, task);
};

// Public API
exports = module.exports = Socketio;
