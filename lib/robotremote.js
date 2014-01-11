'use strict'

var xmlrpc = require('xmlrpc')

function Server(libraries, options) {
    this.host = options.host
    this.port = options.port
    this.timeout = parseInt(options.timeout) || 10000

    var loadedLibraries = {
        'stop_remote_server': {
            doc: 'Stop remote server',
            args: [],
            impl: this.stopRemoteServer
        }
    }

    // Load libraries
    libraries.forEach(function (lib) {
        for (var keywordName in lib) {
            var keyword = lib[keywordName]
            if (keyword.async === undefined) {
                if (keyword.args) {
                    keyword.async = keyword.args.length === keyword.length
                } else {
                    keyword.async = false
                }
            }
            if (!keyword.args) {
                keyword.args = []
                for (var i = 0; i < keyword.length - (keyword.async ? 0 : 1); i++) {
                    keyword.args.push('arg' + (i + 1))
                }
            }
            if (!keyword.doc) {
                keyword.doc = ''
            }
            loadedLibraries[keywordName] = keyword
        }
    })
    this.library = loadedLibraries

    this.allowStop = options.allowStop === true || false
    this.server = xmlrpc.createServer(options)

    // Register functions
    var that = this
    var rpcWrap = function (keyword) {
        return function (method, params, response) {
            params.push(response)
            keyword.apply(that, params)
        }
    }
    this.server.on('get_keyword_names', rpcWrap(this.getKeywordNames))
    this.server.on('run_keyword', rpcWrap(this.runKeyword))
    this.server.on('get_keyword_arguments', rpcWrap(this.getKeywordArguments))
    this.server.on('get_keyword_documentation', rpcWrap(this.getKeywordDocumentation))

    // Register signal handlers.
    var handleSignal = function () {
        process.removeListener('SIGHUP', handleSignal)
        process.removeListener('SIGINT', handleSignal)
        that.allowStop = true
        that.stopRemoteServer(function () {
        })
    }
    process.on('SIGHUP', handleSignal)
    process.on('SIGINT', handleSignal)

    console.log('Robot Framework remote server starting at ' + this.host + ':' + this.port)
}

exports.Server = Server

Server.prototype.getKeywordDocumentation = function (name, response) {
    response(null, this.library[name].doc)
}

Server.prototype.getKeywordArguments = function (name, response) {

    response(null, this.library[name].args)
}

Server.prototype.stopRemoteServer = function (response) {
    var prefix = 'Robot Framework remote server at ' + this.host + ':' + this.port
    if (this.allowStop) {
        console.log(prefix + ' stopping')
        this.server.close(function () {
            response(null, true)
        })
    } else {
        console.log(prefix + ' does not allow stopping')
        response(null, false)
    }
}

Server.prototype.runKeyword = function (name, params, response) {
    var keyword = this.library[name]
    var returned = false
    var timeout
    var keywordReturn = function (val) {
        if (returned) {
            return
        }
        clearTimeout(timeout)
        returned = true
        var result = {'status': 'PASS', 'output': '', 'traceback': '', 'return': '', 'error': ''}
        if (val instanceof Error) {
            result['traceback'] = val.stack.toString()
            result['status'] = 'FAIL'
            result['error'] = val.toString()
        } else {
            result['return'] = val
        }
        response(null, result)
    }
    timeout = setTimeout(function () {
        keywordReturn(new Error("Keyword execution got timeout"))
    }, this.timeout)

    if (keyword.async === false) {
        params.push(keywordReturn)
    }
    try {
        var result = keyword.apply(this, params)
    } catch (e) {
        keywordReturn(e)
    }
    if (!returned && keyword.async) {
        keywordReturn(result)
    }
}

Server.prototype.getKeywordNames = function (response) {
    response(null, Object.keys(this.library))
}
