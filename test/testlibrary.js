'use strict';

var assert = require('assert');

var lib = module.exports;

lib.doNothing = function () {
};

lib.concatenateArguments = function (arg1, arg2) {
    return arg1 + arg2;
};

lib.justFail = function () {
    assert.equal(false, true);
};

// Run this keyword library if the library itself is called explicitly.
if (!module.parent) {
    var robot = require('../lib/robotremote');
    var options = { host: process.argv[2], port: parseInt(process.argv[3], 10), allowStop: true };
    var server = new robot.Server([lib], options);
}
