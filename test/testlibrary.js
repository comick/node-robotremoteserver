'use strict';

var assert = require('assert');

var lib = module.exports;

lib.doNothing = () => {};
lib.doNothing.tags = ['tag1', 'tag2'];

lib.concatenateArguments = (arg1, arg2) => arg1 + arg2;

lib.concatenateArgumentsWithCommentsInArgs = (arg1, arg2 /*, skipped arg */) => arg1 + arg2;

lib.concatenateArgumentsWithVarArguments = (prefix, ...args) => prefix + JSON.stringify(args);
lib.concatenateArgumentsWithVarArguments.args = ['prefix', '*args'];

lib.concatenateArgumentsWithNamedArguments = (prefix, kwargs) => prefix + JSON.stringify(kwargs);
lib.concatenateArgumentsWithNamedArguments.args = ['prefix', '**kwargs'];

// For language constraints, var arguments should be declared at the end, so the last
// args will be kwargs
lib.concatenateArgumentsWithVarAndNamedArguments = (prefix, ...args) => prefix + JSON.stringify(args);
lib.concatenateArgumentsWithVarAndNamedArguments.args = ['prefix', '*args', '**kwargs'];

lib.justFail = () => {
    throw new Error();
}

// TODO add tests for logs and naumer single argument without brackets

lib.doNothingAsync = async () => {};

lib.concatenateArgumentsAsync = async (arg1, arg2) => arg1 + arg2;

lib.concatenateArgumentsWithVarArgumentsAsync = async (prefix, ...args) => prefix + JSON.stringify(args);
lib.concatenateArgumentsWithVarArgumentsAsync.args = ['prefix', '*args'];

lib.concatenateArgumentsWithNamedArgumentsAsync = async (prefix, kwargs) => prefix + JSON.stringify(kwargs);
lib.concatenateArgumentsWithNamedArgumentsAsync.args = ['prefix', '**kwargs'];

// For language constraints, var arguments should be declared at the end, so the last
// args will be kwargs
lib.concatenateArgumentsWithVarAndNamedArgumentsAsync = async (prefix, ...args) => prefix + JSON.stringify(args);
lib.concatenateArgumentsWithVarAndNamedArgumentsAsync.args = ['prefix', '*args', '**kwargs'];

lib.justFailAsync = async () => {
    throw new Error();
};

lib.neverReturn = async () => {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
    await sleep(1000 * 60 * 60);
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
