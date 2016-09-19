'use strict';

var benchmark = require("./scaffold");

var asap = require("asap");
var rawAsap = require("asap/raw");

/** asap default capacity */
var CAPACITY = 1024;

var nextTask = require("../src/next-task");

nextTask.setCapacity(CAPACITY);

var PENDING = 100;

var global = Function('return this')();

var MutObserver = global.MutationObserver ||
                  global.WebKitMutationObserver;

function wrapToQueue(base, method) {
  var queue = [], index = 0;

  function flush() {
    while (index < queue.length) {

      queue[index++].call();

      if (index > CAPACITY) {
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

  return function(task) {
    queue[queue.length] = task;

    if (queue.length === 1) base[method](flush);
  };
}

benchmark.time("asap", function (done) {
    var pending = PENDING;

    for (var i = 0; i < PENDING; ++i) {
        asap(function () {
            --pending;
            if (pending === 0) {
                done();
            }
        });
    }
});

benchmark.time("rawAsap", function (done) {
    var pending = PENDING;

    for (var i = 0; i < PENDING; ++i) {
        rawAsap(function () {
            --pending;
            if (pending === 0) {
                done();
            }
        });
    }
});

benchmark.time("nextTask", function (done) {
    var pending = PENDING;

    for (var i = 0; i < PENDING; ++i) {
        nextTask(function () {
            --pending;
            if (pending === 0) {
                done();
            }
        });
    }
});

if (global.process) {
  benchmark.time("nextTick", function (done) {
    var pending = PENDING;

    for (var i = 0; i < PENDING; ++i) {
        global.process.nextTick(function () {
            --pending;
            if (pending === 0) {
                done();
            }
        });
    }
  });


  benchmark.time("nextTick[]", function (done) {
    var pending = PENDING,
        wrap = wrapToQueue(global.process, 'nextTick');

    for (var i = 0; i < PENDING; ++i) {
        wrap(function () {
            --pending;
            if (pending === 0) {
                done();
            }
        });
    }
  });
}

if (global.setImmediate) {
  benchmark.time("setImmediate", function (done) {
    var pending = PENDING;

    for (var i = 0; i < PENDING; ++i) {
        global.global.setImmediate(function () {
            --pending;
            if (pending === 0) {
                done();
            }
        });
    }
  });

  benchmark.time("setImmediate[]", function (done) {
    var pending = PENDING,
        wrap = wrapToQueue(global, 'setImmediate');

    for (var i = 0; i < PENDING; ++i) {
        wrap(function () {
            --pending;
            if (pending === 0) {
                done();
            }
        });
    }
  });
}

if (global.Promise) {
  benchmark.time("Promise", function (done) {
    var pending = PENDING,
        resolved = global.Promise.resolve();

    for (var i = 0; i < PENDING; ++i) {
        resolved.then(function () {
            --pending;
            if (pending === 0) {
                done();
            }
        });
    }
  });

  benchmark.time("Promise[]", function (done) {
    var pending = PENDING,
        resolved = global.Promise.resolve(),
        wrap = wrapToQueue(resolved, 'then');

    for (var i = 0; i < PENDING; ++i) {
        wrap(function () {
            --pending;
            if (pending === 0) {
                done();
            }
        });
    }
  });
}

if (MutObserver && global.document) {
  benchmark.time("MutationObserver[]", function (done) {
    var pending = PENDING,
        node = global.document.createTextNode(''),
        trigger = 1,
        base = {flush: flush},
        wrap = wrapToQueue(base, 'flush');

    function flush(fn) {
      (new MutObserver(fn)).observe(node, {characterData: true});
      node.data = trigger = -trigger;
    }

    for (var i = 0; i < PENDING; ++i) {
        wrap(function () {
            --pending;
            if (pending === 0) {
                done();
            }
        });
    }
  });
}

if (global.setTimeout) {
  benchmark.time("setTimeout", function (done) {
    var pending = PENDING;

    for (var i = 0; i < PENDING; ++i) {
        global.setTimeout(function () {
            --pending;
            if (pending === 0) {
                done();
            }
        }, 0);
    }
  });

  benchmark.time("setTimeout[]", function (done) {
    var pending = PENDING,
        base = {
          setTimeout: function(fn) {
            global.setTimeout(fn, 0);
          }
        },
        wrap = wrapToQueue(base, 'setTimeout');

    for (var i = 0; i < PENDING; ++i) {
        wrap(function () {
            --pending;
            if (pending === 0) {
                done();
            }
        });
    }
  });
}