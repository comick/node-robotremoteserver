'use strict';

var xmlrpc = require('xmlrpc'),
    isPromise = require('is-promise');

function Server(libraries, options) {
    this.host = options.host;
    this.port = options.port;
    this.timeout = parseInt(options.timeout, 10) || 10000;

    var keywords = {
        'stopRemoteServer': {
            doc: 'Stop remote server',
            args: [],
            impl: this.stopRemoteServer
        }
    };

    // Load libraries
    libraries.forEach(function (lib) {
        for (var keywordName in lib) {
            if (lib.hasOwnProperty(keywordName)) {
                var keyword = lib[keywordName];
                // Parameters name for documenting purpose.
                keyword.args = /\(([\s\S]*?)\)/.exec(keyword.toString())[1].split(/\s*,\s*/);
                if (!keyword.doc) {
                    keyword.doc = '';
                }
                keywords[keywordName] = keyword;
            }
        }
    });
    this.keywords = keywords;

    this.allowStop = options.allowStop === true || false;
    this.server = xmlrpc.createServer(options);

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

    // Register signal handlers.
    var handleSignal = function () {
        process.removeListener('SIGHUP', handleSignal);
        process.removeListener('SIGINT', handleSignal);
        that.allowStop = true;
        that.stopRemoteServer(function () {
        });
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

Server.prototype.stopRemoteServer = function (response) {
    var prefix = 'Robot Framework remote server at ' + this.host + ':' + this.port;
    if (this.allowStop) {
        console.log(prefix + ' stopping');
        this.server.close(function () {
            response(null, true);
        });
    } else {
        console.log(prefix + ' does not allow stopping');
        response(null, false);
    }
};

Server.prototype.runKeyword = function (name, params, response) {
    var keyword = this.keywords[name];
    var timeout = null;
    var keywordReturn = function (val) {
        if (timeout === null) {
            return;
        }
        clearTimeout(timeout);
        timeout = null;
        var result = {status: 'PASS', output: '', traceback: '', return: '', error: ''};
        if (val instanceof Error) {
            result.traceback = val.stack.toString();
            result.status = 'FAIL';
            result.error = val.toString();
        } else {
            result.return = val;
        }
        response(null, result);
    };
    timeout = setTimeout(function () {
        keywordReturn(new Error('Keyword execution got timeout'));
    }, this.timeout);
    var result;
    try {
        result = keyword.apply(this, params);
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


function Client(options) {
    options.path = '/';
    var client = xmlrpc.createClient(options);
    this.client = client;
    var that = this;
    client.methodCall('get_keyword_names', [], function (err, val) {
        val.forEach(function (keywordName) {
            that[keywordName] = function () {
                var arrayArguments = Array.prototype.slice.call(arguments);
                var cb = arrayArguments.pop();
                var args = [keywordName, arrayArguments];
                client.methodCall('run_keyword', args, cb);
            };
            client.methodCall('get_keyword_arguments', [keywordName], function (err, val) {
                that[keywordName].args = val;
            });
            client.methodCall('get_keyword_documentation', [keywordName], function (err, val) {
                that[keywordName].docs = val;
            });
        });
    });
}

module.exports.Client = Client;