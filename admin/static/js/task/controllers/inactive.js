/*
 * admin/static/js/task/controllers/inactive.js
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
    tasks: task.getInactiveTasks()
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
  ngModule.controller('InactiveCtrl', function ($scope, $timeout, task) {
    _injected = {
      $scope: $scope,
      $timeout: $timeout,
      task: task
    };
    _init();
  });
};