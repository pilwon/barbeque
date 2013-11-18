/*
 * admin/static/js/app.js
 */

'use strict';

var _ = require('lodash'),
    $ = require('jquery'),
    angular = require('angular'),
    moment = require('moment'),
    socketio = require('socketio');

var ngModule = angular.module('app', [
  // 'ngAnimate',
  // 'ngCookies',
  // 'ngSanitize',
  // 'pascalprecht.translate',
  'restangular',
  // 'ui.bootstrap',
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

// Set Restacular base URL.
ngModule.config(function (RestangularProvider) {
  RestangularProvider.setBaseUrl('/api');
});

// Routes
// ngModule.config(function ($stateProvider, $urlRouterProvider, layoutProvider) {
//   $stateProvider
//     .state('express', {
//       url: '*path',
//       views: layoutProvider.getViews(),
//       onEnter: function () {
//         if (_.isPlainObject(global.config) && !!global.config.catchAll) {
//           global.location.replace('/404.html');
//         }
//       }
//     });
// });

// Attach variables to $rootScope.
ngModule.run(function ($rootScope, $state, $stateParams) {
  _.assign($rootScope, {
    _: _,
    $: $,
    $state: $state,
    $stateParams: $stateParams,
    documentTitle: 'Barbeque Admin',
    moment: moment
  });
});

// Loading spinner.
ngModule.run(function ($rootScope, layout) {
  // $rootScope.$on('$stateChangeStart', layout.startSpinner);
  // $rootScope.$on('$stateChangeSuccess', layout.stopSpinner);
  // $rootScope.$on('$stateChangeError', layout.stopSpinner);
});

// Connect to socket.io server.
ngModule.run(function () {
  var TASK_DETAIL_CHANNEL = 'task:detail',
      TASK_LIST_CHANNEL = 'task:list',
      TASK_UPDATE_CHANNEL = 'task:update';

  var retryInterval = 5000,
      retryTimer;

  (function connect() {
    clearInterval(retryTimer);

    var socket = global.socket = socketio.connect('', {
      'force new connection': true,
      'max reconnection attempts': Infinity,
      'reconnection limit': 10 * 1000
    });

    socket.on('connect', function () {
      socket.emit('info', {
        // modernizr: Modernizr,
        navigator: _.transform(navigator, function (result, val, key) {
          if (_.isString(val)) {
            result[key] = val;
          }
        })
      });
    });

    socket.on(TASK_DETAIL_CHANNEL, function (task) {
      console.log(task);
    });

    socket.on(TASK_LIST_CHANNEL, function (tasks) {
      console.log(tasks);
    });

    socket.on(TASK_UPDATE_CHANNEL, function (task) {
      console.log(task);
    });

    socket.on('test', function (data) {
      console.log(data);
      socket.emit('test', { hello: 'from browser world' });
    });

    retryTimer = setInterval(function () {
      if (!socket.socket.connected &&
          !socket.socket.connecting &&
          !socket.socket.reconnecting) {
        connect();
      }
    }, retryInterval);
  }());
});
