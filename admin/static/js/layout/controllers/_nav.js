/*
 * admin/static/js/layout/controllers/_nav.js
 */

'use strict';

var _ = require('lodash');

var SECOND = 1000;

var _injected;

function _init() {
  var $scope = _injected.$scope,
      $timeout = _injected.$timeout,
      task = _injected.task;

  _.assign($scope, {
    activeTasks: task.getActiveTasks(),
    processingTasks: task.getProcessingTasks(),
    completeTasks: task.getCompleteTasks(),
    failedTasks: task.getFailedTasks(),
    inactiveTasks: task.getInactiveTasks()
  });

  var updateTimeoutId = $timeout(function update() {
    $scope.$apply();
    updateTimeoutId = $timeout(update, SECOND);
  }, SECOND);

  $scope.$on('$destroy', function () {
    $timeout.cancel(updateTimeoutId);
  });
}

exports = module.exports = function (ngModule) {
  ngModule.controller('_NavCtrl', function ($scope, $timeout, task) {
    _injected = {
      $scope: $scope,
      $timeout: $timeout,
      task: task
    };
    _init();
  });
};
