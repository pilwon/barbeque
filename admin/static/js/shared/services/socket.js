/*
 * admin/static/js/shared/services/socket.js
 */

'use strict';

var socketio = require('socketio');

var TASK_DETAIL_CHANNEL = 'task:detail',
    TASK_LIST_CHANNEL = 'task:list',
    TASK_UPDATE_CHANNEL = 'task:update';

var _injected,
    _retryInterval = 5000,
    _retryTimer,
    _socket;

function connect() {
  clearInterval(_retryTimer);

  var socket = _socket = global.socket = socketio.connect('', {
    'force new connection': true,
    'max reconnection attempts': Infinity,
    'reconnection limit': 10 * 1000
  });

  socket.on('connect', function () {
    requestTaskList();
  });

  socket.on(TASK_DETAIL_CHANNEL, function (errMsg, task) {
    if (errMsg) {
      return console.error(errMsg);
    }
    _injected.$rootScope.$emit(TASK_DETAIL_CHANNEL, task);
  });

  socket.on(TASK_LIST_CHANNEL, function (errMsg, tasks) {
    if (errMsg) {
      return console.error(errMsg);
    }
    _injected.$rootScope.$emit(TASK_LIST_CHANNEL, tasks);
  });

  socket.on(TASK_UPDATE_CHANNEL, function (errMsg, task) {
    if (errMsg) {
      return console.error(errMsg);
    }
    _injected.$rootScope.$emit(TASK_UPDATE_CHANNEL, task);
  });

  _retryTimer = setInterval(function () {
    if (!socket.socket.connected &&
        !socket.socket.connecting &&
        !socket.socket.reconnecting) {
      connect();
    }
  }, _retryInterval);
}

function requestTaskDetail(taskId) {
  _socket.emit(TASK_DETAIL_CHANNEL, taskId);
}

function requestTaskList() {
  _socket.emit(TASK_LIST_CHANNEL);
}

function requestTaskUpdate(task) {
  _socket.emit(TASK_UPDATE_CHANNEL, task);
}

// Public API
exports = module.exports = function (ngModule) {
  ngModule.factory('socket', function ($rootScope) {
    _injected = {
      $rootScope: $rootScope
    };

    connect();

    return {
      connect: connect,
      requestTaskDetail: requestTaskDetail,
      requestTaskList: requestTaskList,
      requestTaskUpdate: requestTaskUpdate
    };
  });
};
