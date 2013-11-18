/*
 * admin/socketio.js
 */

'use strict';

var TASK_DETAIL_CHANNEL = 'task:detail',
    TASK_LIST_CHANNEL = 'task:list',
    TASK_UPDATE_CHANNEL = 'task:update';

function Socket(socket) {
  this._socket = socket;

  socket.emit('test', { hello: 'world' });

  socket.on('test', function (data) {
    console.log(data);
  });

  this.sendAllTasks();
}

Socket.prototype.emit = function () {
  this._socket.emit.apply(this._socket, arguments);
};

Socket.prototype.sendTask = function (taskId) {
  this.emit(TASK_DETAIL_CHANNEL, 'task ' + taskId);
};

Socket.prototype.sendAllTasks = function () {
  this.emit(TASK_LIST_CHANNEL, ['all','tasks']);
};

function Socketio(app, io) {
  this._app = app;
  this._io = io;

  io.sockets.on('connection', function (socket) {
    new Socket(socket);
  });
}

Socketio.prototype.onStateChange = function (task) {
  this._io.sockets.emit(TASK_UPDATE_CHANNEL, task);
};

Socketio.prototype.send = function () {

};

// Public API
exports = module.exports = Socketio;
