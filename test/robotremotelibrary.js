'use strict';

var fs = require('promised-io/fs'),
    assert = require('assert');

var lib = module.exports;

lib.synchronousKeywordWithoutReturnValueAndNoArguments = function () {
};

// Run this keyword library if the library itself is called explicitly.
if (!module.parent) {
    var robot = require('../lib/robotremote');
    var server = new robot.Server([lib], { host: 'localhost', port: 8270, allowStop: true });
}
