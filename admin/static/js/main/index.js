/*
 * admin/static/js/main/index.js
 */

'use strict';

var angular = require('angular');

var ngModule = angular.module('app.main', []);

// Routes
ngModule.config(function ($stateProvider) {
  $stateProvider
    .state('app.home', {
      url: '',
      views: {
        '@': {
          controller: 'HomeCtrl',
          templateUrl: 'tpl/main/home.html'
        }
      }
    });
});

// Controllers
require('./controllers/home')(ngModule);
