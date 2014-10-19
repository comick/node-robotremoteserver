# robotremote

[![NPM](https://nodei.co/npm/robotremote.png?downloads=true&stars=true)](https://nodei.co/npm/robotremote/)
[![NPM](https://nodei.co/npm-dl/robotremote.png?months=6)](https://nodei.co/npm/robotremote/)

[![Build Status](https://travis-ci.org/comick/node-robotremoteserver.svg?branch=master)](https://travis-ci.org/comick/node-robotremoteserver)

  A node.js module providing the [robot framework](http://www.robotframework.org) remote library interface.
  Also provide convenient remote library interface client.

## Installation

Install [robot framework](http://code.google.com/p/robotframework/wiki/Installation) first. Then:

    $ npm install robotremote

## Example

examplelibrary.js:

```js
'use strict';

var fs = require('promised-io/fs'),
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
    return fs.readdir(path).then(function (items) {
        return items.length;
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

    $ node example/examplelibrary.js

Then launch tests:

    $ pybot example/remote_tests.txt

## Using the client

The client is useful for testing keywords from the REPL:

```js
> var robotremote = require('./lib/robotremote')
undefined
> var lib = new robotremote.Client({ host: 'localhost', port: 8270 })
undefined
> lib.stringsShouldBeEqual
{ [Function]
  args: [ 'str1', 'str2' ],
  docs: '' }
> lib.countItemsInDirectory
{ [Function]
  args: [ 'path' ],
  docs: 'Returns the number of items in the directory specified by `path`.' }
> lib.countItemsInDirectory(process.cwd(), function(e, v) { console.log(v) })
undefined
> { output: '', status: 'PASS', return: 16 }
> lib.stringsShouldBeEqual('bau', 'miao', function(e, v) { console.log(v) })
undefined
> { output: '*WARN* Comparing \'bau\' to \'miao\'\n',
  traceback: 'AssertionError: Given strings are not equal\n    at Function.lib.stringsShouldBeEqual (/home/michele/sviluppo/node-robotremoteserver/example/examplelibrary.js:52:12)\n    at Server.runKeyword (/home/michele/sviluppo/node-robotremoteserver/lib/robotremote.js:130:26)\n    at Server.<anonymous> (/home/michele/sviluppo/node-robotremoteserver/lib/robotremote.js:47:21)\n    at Server.emit (events.js:106:17)\n    at /home/michele/sviluppo/node-robotremoteserver/node_modules/xmlrpc/lib/server.js:42:14\n    at callback (/home/michele/sviluppo/node-robotremoteserver/node_modules/xmlrpc/lib/deserializer.js:65:7)\n    at Deserializer.onDone (/home/michele/sviluppo/node-robotremoteserver/node_modules/xmlrpc/lib/deserializer.js:92:12)\n    at SAXStream.emit (events.js:92:17)\n    at Object.SAXStream._parser.onend (/home/michele/sviluppo/node-robotremoteserver/node_modules/xmlrpc/node_modules/sax/lib/sax.js:171:8)\n    at emit (/home/michele/sviluppo/node-robotremoteserver/node_modules/xmlrpc/node_modules/sax/lib/sax.js:325:33)',
  status: 'FAIL',
  error: 'AssertionError: Given strings are not equal',
  contibuable: false,
  fatal: false }
```

## License

Copyright (c) 2013, 2014 Michele Comignano <comick@gmail.com>

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

