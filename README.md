# next-task #

  [![NPM version][npm-image]][npm-url] ![dependencies][dependencies-image] [![License MIT][license-image]](LICENSE)

  Fast microtask queue for all platforms, equivalent rawAsap (based on the ideas and source of rawAsap), but a little faster.

## Usage ##
```js
var nextTask = require('next-task');

nextTask(function() {
  /* this === undefined, arguments.length === 0 */
  console.log('Run this async, but "as soon as possible".');
});

console.log('This run sync.');

/** Log:
 * -> This run sync.
 * -> Run this async, but "as soon as possible".
 */

/** Variant with context: */
var task = {
    data: ...,
    call: function() {/* this === task */}
};

nextTask(task);
```
About rawAsap and microtasks: [rawAsap](https://github.com/kriskowal/asap#raw-asap).
If you need queue of animation tasks, use [raf](https://github.com/chrisdickinson/raf) instead, for synchronize with rendering loop.
If you need to perform a long (macrotask) queue of heavy tasks, use [setImmediate](https://github.com/YuzuJS/setImmediate) to give the browser the ability to handle current events.
Note that, like rawAsap, nextTask does not catch the errors (to work as soon as possible).


## Differences from rawAsap

- **Errors**:
```js
/**
 * If a task does throw an error, with rawAsap you need
 * call requestFlush (after error):
 */
rawAsap.requestFlush();

/**
 * With nextTask just call it without arguments
 *(or with null or undefined), also after error:
 */
nextTask();
```

- **Domains**: nextTask does not support domains for Node.js (rasAsap does).

- **Promise**: nextTask uses native Promise, if it is available (only native, and ignores any polyfills). More information: [Consider using Promise.prototype.then](https://github.com/kriskowal/asap/issues/54).

- **Property 'use'** points to the technology used:
```js
/** In the order of attempts to use: */
nextTask.use === 'setImmediate'     || /* only Node.js */
                 'Promise'          || /* ES6 native promise, if available */
                 'MutationObserver' || /* modern browsers */
                 'setTimeout'          /* all other platforms */
```
- **Method 'setCapacity'** to limit the memory usage (more information: [function to change rawAsap.capacity value must be added](https://github.com/kriskowal/asap/issues/53)):
```js
/* return new actual value */
nextTask.setCapacity(1024); /* return 1024 */

nextTask.setCapacity(); /* return 1024 */
nextTask.setCapacity({}); /* return 1024 */

nextTask.setCapacity(100); /* return 100 */
```

## Build

Install all the packages from devDependencies in ./node_modules, then run:
```bash
npm run build
```
Then you will be able to perform tests and benchmark.

## Benchmarks

```bash
npm run benchmark:node
npm run benchmark:browser
```
This is benchmark from [asap/benchmarks](https://github.com/kriskowal/asap/tree/master/benchmarks), in which different ways queuing added for comparison.
The results are not very stable and not fully explained; for example, a typical result in Node.js:
```bash
asap x 5,584 ops/sec ±3.90% (56 runs sampled)
rawAsap x 39,700 ops/sec ±7.41% (56 runs sampled)
nextTask x 41,186 ops/sec ±7.55% (57 runs sampled)
nextTick x 11,711 ops/sec ±5.81% (58 runs sampled)
nextTick[] x 23,823 ops/sec ±3.49% (59 runs sampled)
setImmediate x 5,860 ops/sec ±4.92% (59 runs sampled)
setImmediate[] x 14,182 ops/sec ±3.91% (59 runs sampled)
Promise x 811 ops/sec ±3.43% (58 runs sampled)
Promise[] x 11,993 ops/sec ±1.89% (55 runs sampled)
setTimeout x 612 ops/sec ±1.95% (59 runs sampled)
setTimeout[] x 768 ops/sec ±1.32% (58 runs sampled)
```

The results of benchmark in DOM even more dependent on the browser.
For example, in modern Chrome:
```bash
asap x 6,770 ops/sec ±4.53% (42 runs sampled)
rawAsap x 27,173 ops/sec ±7.02% (42 runs sampled)
nextTask x 32,403 ops/sec ±3.36% (46 runs sampled)
Promise x 891 ops/sec ±3.33% (44 runs sampled)
Promise[] x 10,534 ops/sec ±2.21% (42 runs sampled)
MutationObserver[] x 4,792 ops/sec ±5.05% (41 runs sampled)
setTimeout x 115 ops/sec ±1.56% (47 runs sampled)
setTimeout[] x 226 ops/sec ±1.85% (50 runs sampled)
```

There "Promise" is run each task by Promise and "Promise[]" means the use of the task queue, so that the whole queue is run with one call Promise; and similarly for the other methods.

## Tests ##
```bash
npm run test:node
npm run test:browser
```

## License ##
  [MIT](LICENSE)

[license-image]: https://img.shields.io/badge/license-MIT-blue.svg "license-image"
[dependencies-image]: https://img.shields.io/gemnasium/mathiasbynens/he.svg?maxAge=2592000 "dependencies-image"
[npm-image]: https://img.shields.io/npm/v/next-task.svg "npm-image"
[npm-url]: https://www.npmjs.com/package/next-task "next-task"