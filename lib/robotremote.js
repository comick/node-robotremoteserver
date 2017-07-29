'use strict';

var xmlrpc = require('xmlrpc'),
    util = require('util');

function Server(libraries, options, listeningCallback) {
    this.host = options.host;
    this.port = options.port;
    this.allowStop = options.allowStop === true || false;
    this.timeout = parseInt(options.timeout, 10) || 10000;

    var keywords = {
        'stopRemoteServer': this.stopRemoteServer
    };

    // Load libraries
    libraries.forEach(function (lib) {
        for (var keywordName in lib) {
            if (lib.hasOwnProperty(keywordName)) {
                var keyword = lib[keywordName];
                // Parameters name for documenting purpose.
                var rawParameters = /\(([\s\S]*?)\)/.exec(keyword.toString())[1];
                keyword.args = rawParameters.length > 0 ? rawParameters.split(/\s*,\s*/) : [];
                if (!keyword.doc) {
                    keyword.doc = '';
                }
                keywords[keywordName] = keyword;
            }
        }
    });
    this.keywords = keywords;

    this.server = xmlrpc.createServer(options, listeningCallback);

    this.stopRemoteServer.host = this.host;
    this.stopRemoteServer.port = this.port;
    this.stopRemoteServer.allowStop = this.allowStop;
    this.stopRemoteServer.server = this.server;

    // Register functions
    var that = this;
    var rpcWrap = function (keyword) {
        return function (method, params, response) {
            params.push(response);
            keyword.apply(that, params);
        };
    };
    this.server.on('get_keyword_names', rpcWrap(this.getKeywordNames));
    this.server.on('run_keyword', rpcWrap(this.runKeyword));
    this.server.on('get_keyword_arguments', rpcWrap(this.getKeywordArguments));
    this.server.on('get_keyword_documentation', rpcWrap(this.getKeywordDocumentation));
    this.server.on('get_keyword_tags', rpcWrap(this.getKeywordTags));

    // Register signal handlers.
    var handleSignal = function () {
        process.removeListener('SIGHUP', handleSignal);
        process.removeListener('SIGINT', handleSignal);
        that.allowStop = true;
        that.stopRemoteServer();
    };
    process.on('SIGHUP', handleSignal);
    process.on('SIGINT', handleSignal);

    console.log('Robot Framework remote server starting at ' + this.host + ':' + this.port);
}

module.exports.Server = Server;

Server.prototype.getKeywordDocumentation = function (name, response) {
    response(null, this.keywords[name].doc);
};

Server.prototype.getKeywordTags = function (name, response) {
    response(null, this.keywords[name].tags);
};

Server.prototype.getKeywordArguments = function (name, response) {
    response(null, this.keywords[name].args);
};

Server.prototype.stopRemoteServer = function () {
    var prefix = 'Robot Framework remote server at ' + this.host + ':' + this.port;
    if (this.allowStop) {
        console.log(prefix + ' stopping');
        var that = this;
        process.nextTick(function () {
            that.server.close(function () {
            });
        });
        return true;
    } else {
        var message = prefix + ' does not allow stopping';
        console.log(message);
        return new Error(message);
    }
};
Server.prototype.stopRemoteServer.doc = 'Stop remote server';
Server.prototype.stopRemoteServer.args = [];

Server.prototype.runKeyword = function (name, params, response) {
    var keyword = this.keywords[name];
    var timeout = null;
    var output = '';
    var keywordReturn = function (val) {
        if (timeout === null) {
            return;
        }
        clearTimeout(timeout);
        timeout = null;
        var result = {output: output};
        if (val instanceof Error) {
            result.traceback = val.stack.toString();
            result.status = 'FAIL';
            result.error = val.toString();
            result.continuable = val.continuable === true || false;
            result.fatal = val.fatal === true || false;
        } else {
            result.status = 'PASS';
            result.return = val;
        }
        response(null, result);
    };
    timeout = setTimeout(function () {
        keywordReturn(new Error('Keyword execution got timeout'));
    }, this.timeout);

    keyword.output = new KeywordLogger(function (line) {
        output = output.concat(line);
    });

    var result;
    try {
        result = keyword.apply(keyword, params);
    } catch (e) {
        // Got sync keyword failure.
        keywordReturn(e);
        return;
    }
    if (isPromise(result)) {
        result.then(keywordReturn, keywordReturn);
    } else {
        // Got sync keyword return.
        keywordReturn(result);
    }
};

Server.prototype.getKeywordNames = function (response) {
    response(null, Object.keys(this.keywords));
};

function KeywordLogger(writeOutput) {

    this.trace = timestampOutputWriter('TRACE');
    this.info = timestampOutputWriter('INFO');
    this.debug = timestampOutputWriter('DEBUG');
    this.warn = timestampOutputWriter('WARN');
    this.html = timestampOutputWriter('HTML');

    function timestampOutputWriter(level) {
        return function () {
            var time = new Date().getTime();
            writeOutput('*' + level + ':' + time + '* ' + util.format.apply(null, arguments) + '\n');
            return time;
        };
    }
}

/**
 * Create a new client with given options
 * @param options a dictionary with xmlrpc options.
 * @param ready callback to call when the client is ready.
 * @constructor
 */
function createClient(options) {
    var Promise = require('promise');
    var result = new Promise(function (resolve, reject) {
        options.path = '/';
        var client = xmlrpc.createClient(options);
        var keywords = {};
        client.methodCall('get_keyword_names', [], function (err, val) {
            if (err) {
                reject(err);
                return;
            }
            val.forEach(function (keywordName) {
                keywords[keywordName] = function () {
                    var arrayArguments = Array.prototype.slice.call(arguments);
                    var args = [keywordName, arrayArguments];
                    var promise = new Promise(function (resolve, reject) {
                        client.methodCall('run_keyword', args, function (err, res) {
                            if (err) {
                                reject(err);
                            } else if (res.status === 'PASS') {
                                resolve(res);
                            } else {
                                reject(res);
                            }
                        });
                    });
                    return promise;
                };
                client.methodCall('get_keyword_arguments', [keywordName], function (err, val) {
                    keywords[keywordName].args = val;
                });
                client.methodCall('get_keyword_documentation', [keywordName], function (err, val) {
                    keywords[keywordName].docs = val;
                });
            });
            resolve(keywords);
        });
    });
    return result;
}

/**
 * isPromise is Copyright (c) 2014 Forbes Lindesay
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */
function isPromise(obj) {
    return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

module.exports.createClient = createClient;
