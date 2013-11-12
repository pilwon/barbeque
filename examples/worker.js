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

bbq.process('add', function (task, cb) {
  cb(null, task.data.x + task.data.y);
});
