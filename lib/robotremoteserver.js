'use strict'

var xmlrpc = require('xmlrpc')

function RobotRemoteServer(libraries, options) {
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
        for (var keyword in lib) {
            loadedLibraries[keyword] = lib[keyword]
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
        that.allowStop = true
        that.stopRemoteServer(function () {
        })
    }
    process.on('SIGHUP', handleSignal)
    process.on('SIGINT', handleSignal)

    console.log('Robot Framework remote server starting at ' + this.host + ':' + this.port)
}

exports.RobotRemoteServer = RobotRemoteServer

RobotRemoteServer.prototype.getKeywordDocumentation = function (name, response) {
    response(null, this.library[name].doc)
}

RobotRemoteServer.prototype.getKeywordArguments = function (name, response) {
    response(null, this.library[name].args)
}

RobotRemoteServer.prototype.stopRemoteServer = function (response) {
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

RobotRemoteServer.prototype.runKeyword = function (name, params, response) {
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

    // An asynchronous keyword expect one argument more that what declared.
    if (keyword.impl.length > keyword.args.length) {
        params.push(keywordReturn)
        keyword.impl.apply(this, params)
    } else {
        try {
            keywordReturn(keyword.impl.apply(this, params))
        } catch (e) {
            keywordReturn(e)
        }
    }
}

RobotRemoteServer.prototype.getKeywordNames = function (response) {
    response(null, Object.keys(this.library))
}
