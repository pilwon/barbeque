/*
 * admin/static/js/task/controllers/complete.js
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
  ngModule.controller('CompleteCtrl', function ($scope, app) {
    _injected = {
      $scope: $scope,
      app: app
    };

    _.assign($scope, {
      setLimit: setLimit,
      tasks: app.task.getCompleteTasks()
    });

    $scope.$on('$destroy', _onDestroy);
    _onCreate();
  });
};
