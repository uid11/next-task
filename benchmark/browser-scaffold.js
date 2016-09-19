'use strict'; /* global Benchmark */

var results = [], benchmark;

var suite = new Benchmark.Suite();

suite.on('cycle', function (event) {
  var res = String(event.target);
  console.log(res);
  results.push(res);
});

suite.on('complete', function() {
  if (typeof benchmark.onComplete === 'function')
    benchmark.onComplete();
});

function addTimer(s, f) {
  suite.add(s, function (deferred) {
    f(function () {
      deferred.resolve();
    });
  }, {
    defer: true
  });
}

function time(s, f) {
  /**
   * This is to make sure that the function doesn't
   * have any errors before benchmarking it.
   */
  f(function () {});

  addTimer(s, f);
}

function run() {
  suite.run();
}

module.exports = benchmark = {
  time: time,
  run: run,
  results: results
};