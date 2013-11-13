/*
 * examples/task.js
 */

'use strict';

var bbq = new (require('..'))({
  namespace: 'test'
});

bbq.task('add', {
  x: 2,
  y: 3
}).save();

bbq.task('divide', {
  x: 4,
  y: 0
}).save();
