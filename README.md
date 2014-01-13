[![Logo](https://raw.github.com/pilwon/barbeque/master/logo.jpg)](http://en.wikipedia.org/wiki/Barbecue)

[![NPM](https://nodei.co/npm/barbeque.png?downloads=false&stars=false)](https://npmjs.org/package/barbeque) [![NPM](https://nodei.co/npm-dl/barbeque.png?months=6)](https://npmjs.org/package/barbeque)


# Barbeque for Node.js

`Barbeque` is [Redis](http://redis.io)-based task queue library for [Node.js](http://nodejs.org/), inspired by [Celery](http://www.celeryproject.org) and [Kue](https://github.com/LearnBoost/kue).


## Installation

    $ npm install barbeque


## Usage

```js
var config = {
  // host: 'localhost'
  // port: 6379,
  // namespace: 'test'
}
```

### Worker

```js
var Barbeque = require('barbeque'),
    bbq = new Barbeque(config);

bbq.process('add', function (task, done) {
  done(null, task.data.x + task.data.y);
});

//--> New worker created that process `add` tasks.
```

### Task

```js
var Barbeque = require('barbeque'),
    bbq = new Barbeque(config);

bbq.create('add', {
  x: 2,
  y: 3
}).save();

//--> New task saved to Redis DB and notified workers.
```

### Admin UI

```js
var Barbeque = require('barbeque'),
    bbq = new Barbeque();

bbq.admin();
```


* [See more comprehensive examples here.](https://github.com/pilwon/barbeque/tree/master/examples)


## API

```js
.admin()                   // start admin UI
.create(type, data)        // create an instance of Task
.listen()                  // listen to redis updates
.process(type, processfn)  // start a processor of a specific task type
.processAll(obj)           // obj: {key:type,val:data} and nestable
.query(query, cb)          // query: string id, array of string ids, or filter object
.queryDetail(query, cb)    // query: string id, array of string ids, or filter object
.run(processFn, data, cb)  // immediately run a task
.update(taskId, task, cb)  // update task
```

### Task

```js
.save(optionalCallback)    // enqueue task to the task queue
.priority(priority)        // specify task priority (lower value: higher priority)
.ttl(ttl)                  // auto-expire task (in ms)
```

### Worker Events

```js
.on('error', function (err))
.on('active', function (task))
.on('processing', function (task))
.on('complete', function (task))
.on('failed', function (task))
.on('inactive', function (task))
.on('log', function (task, msg))
.on('progress', function (task, percent))
```


## Credits

  See the [contributors](https://github.com/pilwon/barbeque/graphs/contributors).


## License

<pre>
The MIT License (MIT)

Copyright (c) 2013-2014 Pilwon Huh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
</pre>

[![Analytics](https://ga-beacon.appspot.com/UA-47034562-2/barbeque/readme?pixel)](https://github.com/pilwon/barbeque)
