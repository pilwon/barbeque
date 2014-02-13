/*
 * admin/static/js/layout/controllers/_nav.js
 */

'use strict';

var _ = require('lodash');

var _injected,
    _updateIntervalId;

function _onCreate() {
  var $scope = _injected.$scope,
      $timeout = _injected.$timeout,
      app = _injected.app;

  _updateIntervalId = $timeout(function update() {
    $scope.$apply();
    _updateIntervalId = $timeout(update, app.config.task.listUpdateInterval);
  }, app.config.task.listUpdateInterval);
}

function _onDestroy() {
  $timeout.cancel(_updateIntervalId);
}

exports = module.exports = function (ngModule) {
  ngModule.controller('_NavCtrl', function ($scope, $timeout, app) {
    _injected = {
      $scope: $scope,
      $timeout: $timeout,
      app: app
    };

    _.assign($scope, {
      activeTasks: app.task.getActiveTasks(),
      processingTasks: app.task.getProcessingTasks(),
      completeTasks: app.task.getCompleteTasks(),
      failedTasks: app.task.getFailedTasks(),
      inactiveTasks: app.task.getInactiveTasks()
    });

    $scope.$on('$destroy', _onDestroy);
    _onCreate();
  });
};
