'use strict'

var fs = require('fs')
var assert = require('assert')

/**
 * Example of asynchronous keyword.
 *
 * You can implement asynchronous keywords just adding one last parameter after the keyword parameters.
 * That's the callback to return, taking exactly one value:
 *
 * - an instance of `Error` if the keyword failed
 * - arbitrary return value otherwise
 *
 * Keywords are considered asynchronous by default.
 *
 * Just count items in given directory.
 *
 * @param path
 * @param response
 */
function countItemsInDirectory(path, response) {
    fs.readdir(path, function (err, files) {
        response(err || files.length)
    })
}
// The doc attribute is used for inspection on the command line of client. Optional.
countItemsInDirectory.doc = 'Returns the number of items in the directory specified by `path`.'
// Same for arguments, if you omit, a client will see meaningless enumerated names.
// Optional if the keyword is asynchronous (this is the case). Keywords are asynchronous by default.
countItemsInDirectory.args = ['path']

/**
 * Example synchronous keyword.
 *
 * You can make synchronous keywords omitting the args property or explicitly setting the property async at `true`.
 * Then use the javascript return as usual.
 *
 * @param str1
 * @param str2
 */
function stringsShouldBeEqual(str1, str2) {
    console.log('Comparing \'%s\' to \'%s\'', str1, str2)
    assert.equal(str1, str2, 'Given strings are not equal')
}
// If you omitted the args property, you should have set async property to true.
// I choose to default keywords to async because far more common in node scenarios.
stringsShouldBeEqual.args = ['str1', 'str2']


// Export keywords is a good idea when aggregating multiple keyword libraries.
exports.count_items_in_directory = countItemsInDirectory
exports.strings_should_be_equal = stringsShouldBeEqual


// Run this keyword library if the library itself is called explicitly.
if (!module.parent) {
    var robot = require('../lib/robotremote')
    var server = new robot.Server([exports], { host: 'localhost', port: 8270, allowStop: true })
}
