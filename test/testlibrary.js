'use strict';

var assert = require('assert'),
    Promise = require('promise');

var lib = module.exports;

lib.doNothing = function () {
};
lib.doNothing.tags = ['tag1', 'tag2'];

lib.concatenateArguments = function (arg1, arg2) {
    return arg1 + arg2;
};

lib.justFail = function () {
    throw new Error();
};

lib.doNothingAsync = function () {
    return new Promise(function (resolve) {
        resolve();
    });
};

lib.concatenateArgumentsAsync = function (arg1, arg2) {
    return new Promise(function (resolve) {
        resolve(arg1 + arg2);
    });
};

lib.justFailAsync = function () {
    return new Promise(function (resolve, reject) {
        reject(new Error());
    });
};

lib.neverReturn = function () {
    return new Promise(function (resolve, reject) {
    });
};

// Run this keyword library if the library itself is called explicitly.
if (!module.parent) {
    var robot = require('../lib/robotremote');
    var options = {
        host: process.argv[2] || 'localhost',
        port: parseInt(process.argv[3], 10) || 8270,
        timeout: 2000,
        allowStop: true
    };
    var server = new robot.Server([lib], options);
}
