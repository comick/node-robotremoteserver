# node-robotremoteserver

[![NPM](https://nodei.co/npm/robotremoteserver.png?downloads=true&stars=true)](https://nodei.co/npm/robotremoteserver/)
[![NPM](https://nodei.co/npm-dl/robotremoteserver.png?months=6)](https://nodei.co/npm/robotremoteserver/)

  A node.js module providing the [robot framework](http://www.robotframework.org) remote library interface.

## Installation

Install [robot framework](http://code.google.com/p/robotframework/wiki/Installation) first. Then:

    $ npm install robotremoteserver

## Example

examplelibrary.js:

```js
var fs = require('fs')
var assert = require('assert')

/**
 * Example of asynchronous keyword.
 *
 * You can make asynchronous keywords just adding one last parameter `response`.
 * That's the callback to return, taking exactly one value:
 *
 * - an instance of `Error` if the keyword failed
 * - arbitrary return value otherwise
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
// Optional fi the keyword is synchronous (this is not the case).
countItemsInDirectory.args = ['path']

/**
 * Example synchronous keyword.
 *
 * You can make synchronous keywords omitting the args property or explicitly returning a value.
 * The return value must be !== `undefined` because non returning js function return `undefined`.
 * If you don't specify args property and there is no return value, you can use `null`.
 *
 * @param str1
 * @param str2
 */
function stringsShouldBeEqual(str1, str2) {
    console.log('Comparing \'%s\' to \'%s\'', str1, str2)
    assert.equal(str1, str2, 'Given strings are not equal')
}
// In this case you could have omitted the arguments since the keyword is synchronous.
stringsShouldBeEqual.args = ['str1', 'str2']


// Export keywords is a good idea when aggregating multiple keyword libraries.
exports.count_items_in_directory = countItemsInDirectory
exports.strings_should_be_equal = stringsShouldBeEqual


// Run this keyword library if the library itself is called explicitly.
if (!module.parent) {
    var robot = require('../lib/robotremoteserver')
    var server = new robot.RobotRemoteServer([exports], { host: 'localhost', port: 8270, allowStop: true })
}
```

remote_tests.txt:

```
*** Settings ***
Library    Remote    http://localhost:${PORT}

*** Variables ***
${HOST}    localhost
${PORT}    8270

*** Test Cases ***

Count Items in Directory
    ${items1} =    Count Items In Directory    ${CURDIR}
    ${items2} =    Count Items In Directory    ${TEMPDIR}
    Log    ${items1} items in '${CURDIR}' and ${items2} items in '${TEMPDIR}'

Failing Example
    Strings Should Be Equal    Hello    Hello
    Strings Should Be Equal    not      equal
```

Run the remote server:

    $ node examplelibrary.js

The launch tests:

    $ pybot remote_tests.txt


License
=======

Released under the MIT license. See the LICENSE file for the complete wording.

