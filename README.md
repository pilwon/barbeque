[![Logo](https://raw.github.com/pilwon/barbeque/master/logo.jpg)](http://en.wikipedia.org/wiki/Barbecue)

[![NPM](https://nodei.co/npm/barbeque.png?downloads=false&stars=false)](https://npmjs.org/package/barbeque) [![NPM](https://nodei.co/npm-dl/barbeque.png?months=6)](https://npmjs.org/package/barbeque)


# Barbeque for Node.js

`Barbeque` is [Redis](http://redis.io)-based task queue library for [Node.js](http://nodejs.org/), inspired by [Celery](http://www.celeryproject.org) and [Kue](https://github.com/LearnBoost/kue).


## Installation

    $ npm install barbeque


## Usage

### Worker

```js
var Barbeque = require('barbeque'),
    bbq = new Barbeque();

bbq.process('add', function (task, done) {
  done(null, task.data.x + task.data.y);
});

//--> New worker created that process `add` tasks.
```

### Task

```js
var Barbeque = require('barbeque'),
    bbq = new Barbeque();

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
.admin()
.create(type, data)  // Create an instance of Task
.listen()
.process(type, data)
.processAll(obj)  // where obj is {key:type,val:data} and nestable
.run(fn, data, cb)
```

### Task

```js
.priority(priority)
.save(optionalCallback)
```

### Worker Events

```js
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

Copyright (c) 2013 Pilwon Huh

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
