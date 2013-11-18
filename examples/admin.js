/*
 * examples/admin.js
 */

'use strict';

var bbq = new (require('..'))({
  namespace: 'test'
});

bbq.admin({
  namespace: 'test'
}, function (err, url) {
  if (err) { return console.error(err.message); }
  console.info(url);
});
