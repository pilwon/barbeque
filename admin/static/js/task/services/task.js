/*
 * admin/static/js/task/services/task.js
 */

'use strict';

var _ = require('lodash'),
    uuid = require('uuid');

var _tasks = {},
    _activeTasks = [],
    _processingTasks = [],
    _completeTasks = [],
    _failedTasks = [],
    _inactiveTasks = [];

function _addTask(task) {
  task = {
    id: uuid.v4().replace(/-/g, ''),
    state: Math.random() > 0.5 ? 'active' : 'processing',
    type: 'test',
    data: {
      hello: 'world'
    },
    priority: 'normal',
    attempts: 0,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

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

function getActiveTasks() {
  return _activeTasks;
}

function getProcessingTasks() {
  return _processingTasks;
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

function setActiveTask(taskId) {
  // TODO
}

function setInactiveTask(taskId) {
  // TODO
}

// Public API
exports = module.exports = function (ngModule) {
  ngModule.factory('task', function () {
    setInterval(function () {
      _addTask();
    }, 100);

    return {
      getActiveTasks: getActiveTasks,
      getProcessingTasks: getProcessingTasks,
      getCompleteTasks: getCompleteTasks,
      getFailedTasks: getFailedTasks,
      getInactiveTasks: getInactiveTasks,
      setActiveTask: setActiveTask,
      setInactiveTask: setInactiveTask
    };
  });
};
