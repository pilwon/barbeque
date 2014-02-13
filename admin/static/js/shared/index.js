/*
 * admin/static/js/shared/index.js
 */

'use strict';

var angular = require('angular');

var ngModule = angular.module('app.shared', []);

// Directives
require('./directives/focus')(ngModule);

// Services
require('./services/alert')(ngModule);
require('./services/app')(ngModule);
require('./services/layout')(ngModule);
require('./services/route')(ngModule);
require('./services/socket')(ngModule);
