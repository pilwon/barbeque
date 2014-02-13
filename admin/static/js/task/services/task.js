/*
 * admin/static/js/task/services/task.js
 */

'use strict';

var _ = require('lodash');

var _tasks = {},
    _activeTasks = [],
    _completeTasks = [],
    _failedTasks = [],
    _inactiveTasks = [],
    _injected,
    _processingTasks = [];

function _addEventListeners() {
  var $rootScope = _injected.$rootScope;

  $rootScope.$on('task:detail', function (e, task) {
    _onTaskDetail(task);
  });

  $rootScope.$on('task:list', function (e, tasks) {
    _onTaskList(tasks);
  });

  $rootScope.$on('task:update', function (e, taskId) {
    _onTaskUpdate(taskId);
  });
}

function _addTask(task) {
  task = _tasks[task.id] = {
    id: task.id,
    state: task.state,
    type: task.type,
    data: JSON.stringify(task.data),
    priority: task.priority,
    attempts: task.attempts,
    progress: task.progress,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };

  if (task.state === 'active') {
    _activeTasks.push(task);
  } else if (task.state === 'processing') {
    _processingTasks.push(task);
  } else if (task.state === 'complete') {
    _completeTasks.push(task);
  } else if (task.state === 'failed') {
    _failedTasks.push(task);
  } else if (task.state === 'inactive') {
    _inactiveTasks.push(task);
  }
}

function buildTaskListLimitArray() {
  return _.range(10, 20, 2)
          .concat(_.range(20, 60, 10));
}

function createTask() {
  // TODO
}

function getActiveTasks() {
  return _activeTasks;
}

function getCompleteTasks() {
  return _completeTasks;
}

function getFailedTasks() {
  return _failedTasks;
}

function getInactiveTasks() {
  return _inactiveTasks;
}

function getProcessingTasks() {
  return _processingTasks;
}

function getTaskDetail(taskId) {
  socket.requestTaskDetail(taskId);
}

function _onTaskDetail(task) {
  // TODO
  console.log(task);
  _addTask(task);
}

function _onTaskList(tasks) {
  // TODO
  console.log(tasks);
  tasks.forEach(function (task) {
    _addTask(task);
  });
}

function _onTaskUpdate(task) {
  // TODO
  console.log(task);
  _addTask(task);
}

function setActiveState(taskId) {
  // TODO
}

function setInactiveState(taskId) {
  // TODO
}

function updateState(task) {
  // TODO
  socket.requestTaskUpdate(task);
}

// Public API
exports = module.exports = function (ngModule) {
  ngModule.factory('task', function ($rootScope, socket) {
    _injected = {
      $rootScope: $rootScope,
      socket: socket
    };

    _addEventListeners();

    // setInterval(function () {
    //   createTask({
    //     id: require('uuid').v4().replace(/-/g, ''),
    //     state: Math.random() > 0.5 ? 'active' : 'processing',
    //     type: 'test',
    //     data: {
    //       hello: 'world'
    //     },
    //     priority: 'normal',
    //     attempts: 0,
    //     progress: 0,
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   });
    // }, 100);

    return {
      createTask: createTask,
      buildTaskListLimitArray: buildTaskListLimitArray,
      getActiveTasks: getActiveTasks,
      getCompleteTasks: getCompleteTasks,
      getFailedTasks: getFailedTasks,
      getInactiveTasks: getInactiveTasks,
      getProcessingTasks: getProcessingTasks,
      getTaskDetail: getTaskDetail,
      setActiveState: setActiveState,
      setInactiveState: setInactiveState,
      updateState: updateState
    };
  });
};
