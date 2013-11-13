/*
 * examples/worker.js
 */

'use strict';

var bbq = new (require('..'))({
  // host: 'localhost',
  // port: 6379,
  // password: null,
  // namespace: null,
  // prefix: 'bbq'
});

bbq.process('add', function (task, done) {
  done(null, task.data.x + task.data.y);
});

bbq.process('divide', function (task, done) {
  if (task.data.y === 0) {
    return done(new Error('Division by zero.'));
  }
  done(null, task.data.x / task.data.y);
});
