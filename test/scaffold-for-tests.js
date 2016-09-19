'use strict';

var tests = [];
var currentTest;
var passed = 0;
var failed = 0;
var global = Function('return this')();

module.exports = {
  it: it,
  expect: expect,
  run: run
};

function run() {
  var index = 0;
  next();
  function next(error) {
    if (error) {
      done(error);
    } else if (index === tests.length) {
      done(null);
    } else {
      tests[index++].run(next);
    }
  }
  function done(error) {
    if (error) {
      throw error;
    }
    global.global_test_results = {
      passed: !failed
    };
  }
}

function it(name, callback) {
  tests.push(new Test(name, callback));
}

function expect(value) {
  return new Expectation(value, currentTest);
}

function Test(name, callback) {
  this.name = name;
  this.callback = callback;
  this.failed = false;
}

Test.prototype.run = function (done) {
  var self = this;
  currentTest = this;
  this.callback(function (error) {
    if (error) {
      done(error);
    }
    if (self.failed) {
      failed++;
    } else {
      passed++;
    }
    done();
  });
};

function Expectation(value, test) {
  this.value = value;
  this.test = test;
}

Expectation.prototype.toBe = function (value) {
  var ok = this.value === value;
  if (!ok) {
    this.test.failed = true;
  }
};

Expectation.prototype.toEqual = function (value) {
  var ok = equals(this.value, value);
  if (!ok) {
    this.test.failed = true;
  }
};

function equals(a, b) {
  if (isArray(a)) {
    if (!isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (var index = 0; index < a.length; index++) {
      if (!equals(a[index], b[index])) {
        return false;
      }
    }
    return true;
  } else {
    return a === b;
  }
}

function isArray(object) {
  return typeof object === "object" && Object.prototype.toString.call(object) === "[object Array]";
}