/*
 * admin/static/js/task/index.js
 */

'use strict';

var angular = require('angular');

var ngModule = angular.module('app.task', []);

// Routes
ngModule.config(function ($stateProvider) {
  $stateProvider
    .state('app.active', {
      url: '/active',
      views: {
        '@': {
          controller: 'ActiveCtrl',
          templateUrl: 'tpl/task/active.html'
        }
      }
    })
    .state('app.processing', {
      url: '/processing',
      views: {
        '@': {
          controller: 'ProcessingCtrl',
          templateUrl: 'tpl/task/processing.html'
        }
      }
    })
    .state('app.complete', {
      url: '/complete',
      views: {
        '@': {
          controller: 'CompleteCtrl',
          templateUrl: 'tpl/task/complete.html'
        }
      }
    })
    .state('app.failed', {
      url: '/failed',
      views: {
        '@': {
          controller: 'FailedCtrl',
          templateUrl: 'tpl/task/failed.html'
        }
      }
    })
    .state('app.inactive', {
      url: '/inactive',
      views: {
        '@': {
          controller: 'InactiveCtrl',
          templateUrl: 'tpl/task/inactive.html'
        }
      }
    });
});

// Controllers
require('./controllers/active')(ngModule);
require('./controllers/processing')(ngModule);
require('./controllers/complete')(ngModule);
require('./controllers/failed')(ngModule);
require('./controllers/inactive')(ngModule);

// Services
require('./services/task')(ngModule);
