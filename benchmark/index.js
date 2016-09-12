'use strict';

var drain = require("./drain");
var benchmark = require("./scaffold");

if (typeof window === 'undefined') benchmark.run();

module.exports = benchmark;