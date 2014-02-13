/*
 * admin/static/js/task/controllers/inactive.js
 */

'use strict';

var _ = require('lodash');

var _injected;

function _onCreate() {

}

function _onDestroy() {

}

function setLimit(limit) {
  _injected.app.config.task.listLimit = limit;
}

exports = module.exports = function (ngModule) {
  ngModule.controller('InactiveCtrl', function ($scope, app, task) {
    _injected = {
      $scope: $scope,
      app: app
    };

    _.assign($scope, {
      setLimit: setLimit,
      tasks: app.task.getInactiveTasks()
    });

    $scope.$on('$destroy', _onDestroy);
    _onCreate();
  });
};
