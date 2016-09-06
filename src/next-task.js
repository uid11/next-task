'use strict';

/** 
 * @file Fast async (micro)task queue for all platforms (based on asap.js code)
 */

var queue = [], nextTask, trigger, node,
    index = 0, capacity = 2048,
    global = flush.constructor('return this')();

/**
 * Run all tasks in queue. No catch errors.
 */
function flush() {
  while (index < queue.length) {

    queue[index++].call();

    if (index > capacity) {
      var len = queue.length - index;
      for (var i = 0; i < len; ++i) {
        queue[i] = queue[index + i];
      }
      queue.length = len;
      index = 0;
    }
  }
  index = queue.length = 0;
}

/**
 * Node.js. Use setImmediate. No domain support.
 */
if (({}).toString.call(global.process) === '[object process]' &&
    typeof global.setImmediate === 'function') {

  node = global.process.nextTick;
  trigger = global.setImmediate;
  nextTask = function nextTask(task) {
    if (task) queue[queue.length] = task;
    if (queue.length === 1) {

      node(flush);

    } else {

      if (!task) trigger(flush);

    }
  };
  nextTask.use = 'setImmediate';
}

/**
 * ES6. Use native Promise, if exists.
 */
if (!nextTask && typeof global.Promise === 'function') try {
  flush.constructor('!' + flush.toString.call(global.Promise));
} catch (e) {

  trigger = global.Promise.resolve();
  nextTask = function nextTask(task) {
    if (task) queue[queue.length] = task;
    if (queue.length === 1 || !task) {

      trigger.then(flush);

    }
  };
  nextTask.use = 'Promise';
}

/**
 * Modern browsers. Use mutation observer.
 */
if (!nextTask  && global.document &&
    (global.MutationObserver || global.WebKitMutationObserver)) {

  node = global.document.createTextNode('');
  (new (global.MutationObserver ||
        global.WebKitMutationObserver)(flush))
        .observe(node, {characterData: true});

  trigger = true;
  nextTask = function nextTask(task) {
    if (task) queue[queue.length] = task;
    if (queue.length === 1 || !task) {

      node.data = (trigger = !trigger) ? 't' : 'f';

    }
  };
  nextTask.use = 'MutationObserver';
}

/**
 * Other platforms. Use setTimeout && setInterval.
 */
if (!nextTask) {

  trigger = {tId: 0, iId: 0};
  nextTask = function nextTask(task) {
    if (task) queue[queue.length] = task;
    if (queue.length === 1 || !task) {

      clearTimeout (trigger.tId);
      clearInterval(trigger.iId);
      trigger.tId = setTimeout (flush,  0);
      trigger.iId = setInterval(flush, 32);

    }
  };
  nextTask.use = 'setTimeout';

  flush = function flush() {
    clearTimeout (trigger.tId);
    clearInterval(trigger.iId);
    while (index < queue.length) {
      queue[index++].call();
      if (index > capacity) {
        var len = queue.length - index;
        for (var i = 0; i < len; ++i) {
          queue[i] = queue[index + i];
        }
        queue.length = len;
        index = 0;
      }
    }
    index = queue.length = 0;
  };
}

nextTask.setCapacity = function setCapacity(value) {
  return capacity = Number(value) || capacity;
};

module.exports = nextTask;