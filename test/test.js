'use strict'; /* global describe, it  */
describe('nextTask', function() {

var scaffold = require("./scaffold");
var nextTask = require("../src/next-task");

var syncFlush = 0;

var global = Function('return this')(),
    window = global.window,
    document = global.document;

/* Use global nextTask for browser tests with different "use". */
if (global.nextTask) nextTask = global.nextTask;

var isNode = ({}).toString.call(global.process) === '[object process]';

var useText = 'Use ' + nextTask.use;

if (isNode) {
  console.log(useText);
} else if (document && document.body) {
  var p = document.createElement('p');
  p.style = 'font-size: 48px; margin: 48px;';
  p.innerHTML = useText;
  document.body.insertBefore(p, document.body.firstChild);
}

function assert(value, msg) {
  if (value !== true) throw Error('Assert ' + (msg || ''));
}

describe('sync', function() {

  it('exists', function() {

    assert(typeof nextTask === 'function');

  });

  it('call without error for false values', function() {

    nextTask();
    nextTask(undefined);
    nextTask(null);
    nextTask(0);
    nextTask('');

  });

  it('doesnt throw with function as argument', function() {

    nextTask(function() {});
    nextTask(function() {return null;});

  });

  it('doesnt throw with object with call-method', function() {

    nextTask({call: Object});
    nextTask(Function);

  });

  if (!isNode) it('doesnt throw even task throw error (but need manual flush)',
    function() {

      nextTask(function() {throw Error();});
      syncFlush++;

      nextTask(function() {throw Error();});
      syncFlush++;

      nextTask(function() {throw Error();});
      syncFlush++;
      nextTask(function() {throw Error();});
      syncFlush++;

    }
  );

  it('has use property', function() {
    assert(typeof nextTask.use === 'string');
  });

  it('has setCapacity method', function() {
    assert(typeof nextTask.setCapacity === 'function');
  });

  it('setCapacity dont throw with any arguments', function() {

    var capacity = nextTask.setCapacity();

    nextTask.setCapacity();
    nextTask.setCapacity(undefined);
    nextTask.setCapacity(null);
    nextTask.setCapacity(0);
    nextTask.setCapacity(-0);
    nextTask.setCapacity(-5);
    nextTask.setCapacity(Infinity);

    nextTask.setCapacity(capacity);

  });

  it('return new capacity', function() {

    var capacity = nextTask.setCapacity();

    assert(Number(capacity) === capacity);

    assert(nextTask.setCapacity() === capacity);
    assert(nextTask.setCapacity(0) === capacity);
    assert(nextTask.setCapacity('') === capacity);
    assert(nextTask.setCapacity(null) === capacity);
    assert(nextTask.setCapacity(undefined) === capacity);
    assert(nextTask.setCapacity({}) === capacity);
    assert(nextTask.setCapacity([]) === capacity);

    assert(nextTask.setCapacity(2048) === 2048);
    assert(nextTask.setCapacity(capacity) === capacity);

  });

});


describe('async', function() {

  it('should flush', function(done) {

    var MS_WAIT = 256;

    this.timeout(MS_WAIT * (syncFlush + 2));

    function onerror(error) {
      if (global.console) {
        console.log('Global error: ' + error);
      }
    }

    /* Switch off Mocha asunc error cather. */
    if (window) window.onerror = onerror;

    for (var i = 0; i < syncFlush; ++i) {
      setTimeout(nextTask, MS_WAIT*(i + 1));
    }

    nextTask(done);

  });


  it('should do tasks', function(done) {

    nextTask(done);

  });

  it('should do tasks quickly', function(done) {

    this.timeout(100);

    nextTask(done);

  });

  it('should do task once', function(done) {

    var called = 0;

    nextTask(function() { called++; });

    nextTask(function() {
      if (called === 1) done();
    });

  });

  it('should do all tasks', function(done) {

    var called = 0;

    nextTask(function() { called++; });
    nextTask(function() { called++; });
    nextTask(function() { called++; });

    nextTask(function() {
      if (called === 3) done();
    });

  });

  it('should do all tasks in correct order', function(done) {

    var called = 0;

    nextTask(function() { if (called === 0) called++; });
    nextTask(function() { if (called === 1) called++; });
    nextTask(function() { if (called === 2) called++; });

    nextTask(function() {
      if (called === 3) done();
    });

  });

  it('should do thousands tasks in correct order', function(done) {

    var called = 0, index = 0, REPEATS = 4096;

    function getNext() {
      var fnumber = index++;
      return function() {
        assert(
           fnumber === called,
          'fnumber: ' + fnumber + ', called: ' + called
        );
        called++;
      };
    }

    for(var i = 0; i < REPEATS; ++i) {
      nextTask(getNext());
    }

    nextTask(function() {
      if (called === REPEATS) done();
    });

  });

  it('should do thousands nested tasks', function(done) {

    var index = 0, REPEATS = 8192;

    this.timeout(32*REPEATS);

    function next() {
      if (index++ === REPEATS) return done();
      nextTask(next);
    }

    nextTask(next);

  });

});

describe('original rawAsap tests', function() {

  var expect = scaffold.expect;
  var asap = nextTask;
  var MAX_RECURSION = 10;
  var WAIT_FOR_NORMAL_CASE = 100;

    it("calls task in a future turn", function (done) {
        var called = false;
        asap(function () {
            called = true;
            done();
        });
        expect(called).toBe(false);
    });

    it("calls task.call method in a future turn", function (done) {
        var called = false;
        asap({call: function () {
            called = true;
            done();
        }});
        expect(called).toBe(false);
    });

    it("calls multiple tasks in order", function (done) {
        var calls = [];

        asap(function () {
            calls.push(0);
        });
        asap(function () {
            calls.push(1);
        });
        asap(function () {
            calls.push(2);
        });

        expect(calls).toEqual([]);
        setTimeout(function () {
            expect(calls).toEqual([0, 1, 2]);
            done();
        }, WAIT_FOR_NORMAL_CASE);
    });

    it("calls tasks in breadth-first order", function (done) {
        var calls = [];

        asap(function () {
            calls.push(0);

            asap(function () {
                calls.push(2);

                asap(function () {
                    calls.push(5);
                });

                asap(function () {
                    calls.push(6);
                });
            });

            asap(function () {
                calls.push(3);
            });
        });

        asap(function () {
            calls.push(1);

            asap(function () {
                calls.push(4);
            });
        });

        expect(calls).toEqual([]);
        setTimeout(function () {
            expect(calls).toEqual([0, 1, 2, 3, 4, 5, 6]);
            done();
        }, WAIT_FOR_NORMAL_CASE);
    });

    it("can schedule more than capacity tasks", function(done) {
        var target = 1060;
        var targetList = [];
        var i;
        for (i=0; i<target; i++) {
            targetList.push(i);
        }

        var newList = [];
        for (i=0; i<target; i++) {
            (function(i) {
                asap(function() {
                    newList.push(i);
                });
            })(i);
        }

        setTimeout(function () {
            expect(newList).toEqual(targetList);
            done();
        }, WAIT_FOR_NORMAL_CASE);
    });

    it("can schedule more than capacity*2 tasks", function(done) {
        var target = 2060;
        var targetList = [];
        var i;
        for (i=0; i<target; i++) {
            targetList.push(i);
        }

        var newList = [];
        for (i=0; i<target; i++) {
            (function(i) {
                asap(function() {
                    newList.push(i);
                });
            })(i);
        }

        setTimeout(function () {
            expect(newList).toEqual(targetList);
            done();
        }, WAIT_FOR_NORMAL_CASE);
    });

    // Recursion

    it("can schedule tasks recursively", function (done) {
        var steps = [];

        asap(function () {
            steps.push(0);
            asap(function () {
                steps.push(2);
                asap(function () {
                    steps.push(4);
                });
                steps.push(3);
            });
            steps.push(1);
        });

        setTimeout(function () {
            expect(steps).toEqual([0, 1, 2, 3, 4]);
            done();
        }, WAIT_FOR_NORMAL_CASE);
    });

    it("can recurse " + MAX_RECURSION + " tasks deep", function (done) {
        var timesRecursed = 0;
        function go() {
            if (++timesRecursed < MAX_RECURSION) {
                asap(go);
            }
        }

        asap(go);

        setTimeout(function () {
            expect(timesRecursed).toBe(MAX_RECURSION);
            done();
        }, WAIT_FOR_NORMAL_CASE);
    });

    it("can execute two branches of recursion in parallel", function (done) {
        var timesRecursed1 = 0;
        var timesRecursed2 = 0;
        var calls = [];

        function go1() {
            calls.push(timesRecursed1 * 2);
            if (++timesRecursed1 < MAX_RECURSION) {
                asap(go1);
            }
        }

        function go2() {
            calls.push(timesRecursed2 * 2 + 1);
            if (++timesRecursed2 < MAX_RECURSION) {
                asap(go2);
            }
        }

        asap(go1);
        asap(go2);

        setTimeout(function () {
            expect(calls.length).toBe(MAX_RECURSION * 2);
            for (var index = 0; index < MAX_RECURSION * 2; index++) {
                expect(calls[index]).toBe(index);
            }
            done();
        }, WAIT_FOR_NORMAL_CASE);
    });

});

});