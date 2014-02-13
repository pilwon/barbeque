/*
 * admin/static/js/task/controllers/active.js
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
  ngModule.controller('ActiveCtrl', function ($scope, app) {
    _injected = {
      $scope: $scope,
      app: app
    };

    _.assign($scope, {
      setLimit: setLimit,
      tasks: app.task.getActiveTasks()
    });

    $scope.$on('$destroy', _onDestroy);
    _onCreate();
  });
};
