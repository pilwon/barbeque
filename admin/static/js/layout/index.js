/*
 * admin/static/js/layout/index.js
 */

'use strict';

var angular = require('angular');

var ngModule = angular.module('app.layout', []);

var _views = {
  'alert': {
    controller: '_AlertCtrl',
    templateUrl: 'tpl/layout/_alert.html'
  },
  'footer': {
    controller: '_FooterCtrl',
    templateUrl: 'tpl/layout/_footer.html'
  },
  'header': {
    controller: '_HeaderCtrl',
    templateUrl: 'tpl/layout/_header.html'
  },
  'nav': {
    controller: '_NavCtrl',
    templateUrl: 'tpl/layout/_nav.html'
  }
};

// Routes
ngModule.config(function ($stateProvider, layoutProvider) {
  $stateProvider
    .state('app', {
      abstract: true,
      views: _views
    });

  layoutProvider.setViews(_views);
});

// Controllers
require('./controllers/_alert')(ngModule);
require('./controllers/_footer')(ngModule);
require('./controllers/_header')(ngModule);
require('./controllers/_nav')(ngModule);
