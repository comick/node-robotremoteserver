'use strict';

var xmlrpc = require('xmlrpc'),
    util = require('util'),
    isPromise = require('is-promise');

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

    // TODO trovare modo migliore per fargliele riferire e anche illog dentro con va col ctrl C
    this.stopRemoteServer.host = this.host;
    this.stopRemoteServer.port = this.port;
    this.stopRemoteServer.allowStop = this.allowStop;
    this.stopRemoteServer.server = this.server;

    // Register functions
    var that = this;// TODO rpcWrappare anche stopremoteserver
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
        var result = { output: output };
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
    function outputWriter(level) {
        return function () {
            writeOutput('*' + level + '* ' + util.format.apply(null, arguments) + '\n');
        };
    }

    this.trace = outputWriter('TRACE');
    this.info = outputWriter('INFO');
    this.debug = outputWriter('DEBUG');
    this.warn = outputWriter('WARN');
    this.html = outputWriter('HTML');

    function timestampOutputWriter(level) {
        return function () {
            writeOutput('*' + level + ':' + new Date().getTime() + '* ' + util.format.apply(null, arguments) + '\n');
        };
    }

    this.timestampTrace = timestampOutputWriter('TRACE');
    this.timestampInfo = timestampOutputWriter('INFO');
    this.timestampDebug = timestampOutputWriter('DEBUG');
    this.timestampWarn = timestampOutputWriter('WARN');
    this.timestampHtml = timestampOutputWriter('HTML');
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

module.exports.createClient = createClient;
