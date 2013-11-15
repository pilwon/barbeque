/*
 * lib/helper.js
 */

'use strict';

var _ = require('lodash'),
    uuid = require('uuid');

function flattenDot(multiLevelObject) {
  return _.reduce(multiLevelObject, function (result, val, key) {
    var flatObject;
    if (_.isPlainObject(val)) {
      flatObject = flattenDot(val);
      _.forEach(flatObject, function (flatVal, flatKey) {
        result[key + '.' + flatKey] = flatVal;
      });
      delete result[key];
    } else {
      flatObject = val;
      result[key] = flatObject;
    }
    return result;
  }, {});
}

function genId() {
  return uuid.v4().replace(/-/g, '');
}

// Public API
exports.flattenDot = flattenDot;
exports.genId = genId;
