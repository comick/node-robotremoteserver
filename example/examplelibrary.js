'use strict';

var readdir = require('promise').denodeify(require('fs').readdir),
    robot = require('../lib/robotremote'),
    assert = require('assert');

var lib = module.exports;

/**
 * Example of asynchronous keyword.
 *
 * You can implement asynchronous keywords just returning an A+ promise.
 * Promise can be resolved or rejected with respectively:
 *
 * - arbitrary return value, or
 * - an instance of `Error` if the keyword failed
 *
 * Just count items in given directory.
 *
 * @param path directory path to count item in.
 */
lib.countItemsInDirectory = function (path) {
    return readdir(path).then(function (files) {
        return files.length;
    });
};
// The doc attribute is used for inspection on the command line of client and doc generation.
// It's optional and defaults to empty string when missing.
lib.countItemsInDirectory.doc = 'Returns the number of items in the directory specified by `path`.';

/**
 * Example synchronous keyword.
 *
 * Any keyword which does not return an A+ promise is considered sync.
 * The following are considered successes:
 *
 * - the keyword returns `undefined` (that is doesn't return any value)
 * - the keyword return any other value
 *
 * While any thrown `Error` instance will lead the keyword failure.
 *
 * Each keyword also have the output writer, which enables logging at various levels.
 * Here warn level is showed as an example.
 * All robot levels are supported including messages with timestamp through timestamp`Level` function.
 * See http://robotframework.googlecode.com/hg/doc/userguide/RobotFrameworkUserGuide.html?r=2.8.5#logging-information
 *
 * @param str1
 * @param str2
 */
lib.stringsShouldBeEqual = function (str1, str2) {
    this.output.warn('Comparing \'%s\' to \'%s\'', str1, str2);
    assert.equal(str1, str2, 'Given strings are not equal');
};


// Run this keyword library if the library itself is called explicitly.
if (!module.parent) {
    var server = new robot.Server([lib], { host: 'localhost', port: 8270 });
}
