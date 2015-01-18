'use strict';

var assert = require('assert'),
    Promise = require('promise');

var lib = module.exports;

lib.doNothing = function () {
};

lib.concatenateArguments = function (arg1, arg2) {
    return arg1 + arg2;
};

lib.justFail = function () {
    assert.equal(false, true);
};

lib.doNothingAsync = function () {
    return new Promise(function (resolve, reject) {
        resolve();
    });
};

lib.concatenateArgumentsAsync = function (arg1, arg2) {
    return new Promise(function (resolve, reject) {
        resolve(arg1 + arg2);
    });
};

lib.justFailAsync = function () {
    return new Promise(function (resolve, reject) {
        try {
            assert.equal(false, true);
        } catch (e) {
            reject(e);
        }
    });
};

lib.neverReturn = function () {
    return new Promise(function (resolve, reject) {
    });
};

// Run this keyword library if the library itself is called explicitly.
if (!module.parent) {
    var robot = require('../lib/robotremote');
    var options = { host: process.argv[2], port: parseInt(process.argv[3], 10), timeout: 2000, allowStop: true };
    var server = new robot.Server([lib], options);
}
