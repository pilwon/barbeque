/*
 * admin/static/js/shared/services/app.js
 */

'use strict';

var _ = require('lodash');

var _injected;

var config = {};

function _initConfig() {
  var $cookieStore = _injected.$cookieStore,
      $rootScope = _injected.$rootScope;

  // Load global config.
  if (_.isPlainObject(global.config)) {
    config = global.config;
  }

  // Set cookie defaults
  if (_.isUndefined($cookieStore.get('task.listLimit'))) {
    $cookieStore.put('task.listLimit', 10);
  }

  // Config defaults.
  config = _.defaults(config, {
    task: {
      listLimit: $cookieStore.get('task.listLimit'),
      listUpdateInterval: 300
    }
  });

  // Convert config to scope.
  config = _.defaults($rootScope.$new(), config);

  // Update cookies on config change.
  config.$watch('task.listLimit', function () {
    $cookieStore.put('task.listLimit', config.task.listLimit);
  });
}

// Public API
exports = module.exports = function (ngModule) {
  ngModule.factory('app', function ($cookieStore, $rootScope, socket, task) {
    _injected = {
      $cookieStore: $cookieStore,
      $rootScope: $rootScope,
      socket: socket,
      task: task
    };

    _initConfig();

    return {
      config: config,
      socket: socket,
      task: task
    };
  });
};
