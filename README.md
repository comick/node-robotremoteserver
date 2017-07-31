# robotremote

[![NPM](https://nodei.co/npm/robotremote.png?downloads=true&stars=true)](https://nodei.co/npm/robotremote/)
[![NPM](https://nodei.co/npm-dl/robotremote.png?months=6)](https://nodei.co/npm/robotremote/)

[![Build Status](https://travis-ci.org/comick/node-robotremoteserver.svg?branch=master)](https://travis-ci.org/comick/node-robotremoteserver)

  A node.js module providing the [robot framework](http://www.robotframework.org) remote library interface.
  Also provide convenient remote library interface client.

## Installation

Install [robot framework](https://github.com/robotframework/robotframework/blob/master/INSTALL.rst) first. Then:

    $ npm install robotremote

## Example

Just little example with main features. Test folder contains better extensive examples for more features.

examplelibrary.js:

```js
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
 * See http://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#logging-information
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
```

remote_tests.robot:

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

    $ node example/examplelibrary.js

Then launch tests:

    $ pybot example/remote_tests.robot

## Using botclient.js:

The botclient.js command line utility can be useful to test keywords of any compliant running robot remote server.

An example session with the example keywords library follows:

```js
$ node ./bin/botclient.js localhost 8270
Connected to remote server at "localhost:8270"
Available keywords: stopRemoteServer, countItemsInDirectory, stringsShouldBeEqual
localhost:8270> keywords.countItemsInDirectory
{ [Function]
  args: [ 'path' ],
  docs: 'Returns the number of items in the directory specified by `path`.' }
localhost:8270> keywords.stringsShouldBeEqual
{ [Function]
  args: [ 'str1', 'str2' ],
  docs: '' }
localhost:8270> keywords.stringsShouldBeEqual('ciao', 'ciao').done(console.log)
undefined
localhost:8270> { output: '*WARN* Comparing \'ciao\' to \'ciao\'\n',
  status: 'PASS',
  return: '' }
```

Keywords are available in context in the keywords dictionary. When called they return an A+ promise.


## License

Copyright (c) 2013-2017 Michele Comignano <comick@gmail.com>

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

