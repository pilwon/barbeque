/*
 * examples/task.js
 */

'use strict';

var bbq = new (require('..'))({
  // host: 'localhost',
  // port: 6379,
  // password: null,
  // namespace: null,
  // prefix: 'bbq'
});

bbq.task('add', {
  x: 2,
  y: 3
}).save();

bbq.task('divide', {
  x: 4,
  y: 0
}).save();
