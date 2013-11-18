/*
 * examples/worker.js
 */

'use strict';

var util = require('util');

require('colors');

var bbq = new (require('..'))({
  namespace: 'test'
}).on('active', function (/*task*/) {
  // console.info(util.format('[%s:%s] %s', task.id, task.type, JSON.stringify(task.data)));
}).on('processing', function (/*task*/) {
  // console.info(util.format('[%s:%s] %s ...', task.id, task.type, JSON.stringify(task.data)).bold);
}).on('complete', function (task) {
  console.info(util.format('[%s:%s] %s', task.id, task.type, JSON.stringify(task.result)).cyan);
}).on('failed', function (task) {
  console.error(util.format('[%s:%s] %s', task.id, task.type, JSON.stringify(task.result)).red);
}).on('inactive', function (task) {
  console.error(util.format('[%s:%s] %s', task.id, task.type, JSON.stringify(task.result)).grey);
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
