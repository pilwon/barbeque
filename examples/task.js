/*
 * examples/task.js
 */

'use strict';

var bbq = new (require('..'))({
  namespace: 'test'
});

bbq.create('add', {
  x: 2,
  y: 3
}).save();

bbq.create('divide', {
  x: 4,
  y: 0
}).save();
