'use strict'

var fs = require('fs')
var assert = require('assert')

exports.count_items_in_directory = {
    doc: 'Returns the number of items in the directory specified by `path`.',
    args: ['path'],
    impl: function (path, response) {
        fs.readdir(path, function (err, files) {
            response(err || files.length)
        })
    }
}

exports.strings_should_be_equal = {
    doc: 'Returns the number of items in the directory specified by `path`.',
    args: ['str1', 'str2'],
    impl: function (str1, str2) {
        console.log('Comparing \'%s\' to \'%s\'', str1, str2)
        assert.equal(str1, str2, 'Given strings are not equal')
    }
}

if (!module.parent) {
    var robot = require('../lib/robotremoteserver')
    var server = new robot.RobotRemoteServer([exports], { host: 'localhost', port: 8270, allowStop: true })
}
