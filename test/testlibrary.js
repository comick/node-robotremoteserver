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

lib.concatenateArgumentsWithCommentsInArgs = function (arg1, arg2 /*, skipped arg */) {
    return arg1 + arg2;
};

lib.concatenateArgumentsWithVarArguments = function (prefix, ...args) {
    return prefix + JSON.stringify(args);
};
lib.concatenateArgumentsWithVarArguments.args = ['prefix', '*args'];

lib.concatenateArgumentsWithNamedArguments = function (prefix, kwargs) {
    return prefix + JSON.stringify(kwargs);
};
lib.concatenateArgumentsWithNamedArguments.args = ['prefix', '**kwargs'];

// For language constraints, var arguments should be declared at the end, so the last
// args will be kwargs
lib.concatenateArgumentsWithVarAndNamedArguments = function (prefix, ...args) {
    return prefix + JSON.stringify(args);
};
lib.concatenateArgumentsWithVarAndNamedArguments.args = ['prefix', '*args', '**kwargs'];

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

lib.concatenateArgumentsWithVarArgumentsAsync = function (prefix, ...args) {
    return new Promise(function (resolve) {
        resolve(prefix + JSON.stringify(args));
    });
};
lib.concatenateArgumentsWithVarArgumentsAsync.args = ['prefix', '*args'];

lib.concatenateArgumentsWithNamedArgumentsAsync = function (prefix, kwargs) {
    return new Promise(function (resolve) {
        resolve(prefix + JSON.stringify(kwargs));
    });
};
lib.concatenateArgumentsWithNamedArgumentsAsync.args = ['prefix', '**kwargs'];

// For language constraints, var arguments should be declared at the end, so the last
// args will be kwargs
lib.concatenateArgumentsWithVarAndNamedArgumentsAsync = function (prefix, ...args) {
    return new Promise(function (resolve) {
        resolve(prefix + JSON.stringify(args));
    });
};
lib.concatenateArgumentsWithVarAndNamedArgumentsAsync.args = ['prefix', '*args', '**kwargs'];

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
