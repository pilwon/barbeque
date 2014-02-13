/*
 * admin/static/js/app.js
 */

'use strict';

var _ = require('lodash'),
    $ = require('jquery'),
    angular = require('angular'),
    moment = require('moment');

var ngModule = angular.module('app', [
  'ngAnimate',
  'ngCookies',
  'ui.router',
  'app.shared',
  'app.layout',
  'app.main',
  'app.task'
]);

// Enable HTML5 Mode.
ngModule.config(function ($locationProvider) {
  $locationProvider.html5Mode(false);
});

// Routes
ngModule.config(function ($stateProvider) {
  $stateProvider
    .state('catchall', {
      url: '*path',
      onEnter: function () {
        global.location.replace('#');
      }
    });
});

// Attach variables to $rootScope.
ngModule.run(function ($rootScope, $state, $stateParams, app) {
  _.assign($rootScope, {
    _: _,
    $: $,
    $state: $state,
    $stateParams: $stateParams,
    app: app,
    config: config,
    moment: moment
  });
});

// Loading spinner.
ngModule.run(function ($rootScope, layout) {
  $rootScope.$on('$stateChangeStart', layout.startSpinner);
  $rootScope.$on('$stateChangeSuccess', layout.stopSpinner);
  $rootScope.$on('$stateChangeError', layout.stopSpinner);
});
