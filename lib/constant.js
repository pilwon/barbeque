/*
 * lib/constant.js
 */

'use strict';

exports.DEFAULT_HOST = 'localhost';
exports.DEFAULT_PORT = 6379;
exports.DEFAULT_PASSWORD = null;
exports.DEFAULT_NAMESPACE = null;
exports.DEFAULT_PREFIX = 'bbq';

exports.DEFAULT_TASK_ATTEMPTS = 0;

exports.PRIORITY = {
  LOW: 10,
  NORMAL: 0,
  MEDIUM: -5,
  HIGH: -10,
  CRITICAL: -15
};

exports.STATE = {
  ACTIVE: 'active',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  FAILED: 'failed',
  INACTIVE: 'inactive'
};
