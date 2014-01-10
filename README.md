# node-robotremoteserver

[![NPM](https://nodei.co/npm/robotremoteserver.png?downloads=true&stars=true)](https://nodei.co/npm/robotremoteserver/)
[![NPM](https://nodei.co/npm-dl/robotremoteserver.png?months=6)](https://nodei.co/npm/robotremoteserver/)

  A node.js module providing the [robot framework](http://www.robotframework.org) remote library interface.

## Installation

Install [robot framework](http://code.google.com/p/robotframework/wiki/Installation) first. Then:

    $ npm install robotremoteserver

## Example

examplelibrary.js

```js
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
    var server = new robot.RobotRemoteServer([exports], 'localhost', 8270, true)
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

