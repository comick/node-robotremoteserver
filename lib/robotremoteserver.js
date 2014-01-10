'use strict'

var xmlrpc = require('xmlrpc')

function RobotRemoteServer(libraries, host, port, allowStop) {
    this.host = host
    this.port = port

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

    this.allowStop = allowStop
    this.server = xmlrpc.createServer({ host: host, port: port })

    // Register functions
    var that = this
    var rpcWrap = function (method) {
        return function (err, params, response) {
            params.push(response)
            method.apply(that, params)
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

    console.log('Robot Framework remote server starting at ' + host + ':' + port)
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
    var keyword = this.library[name].impl
    var returned = false
    var timeout
    var keywordResponse = function (val) {
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
        keywordResponse(new Error("Keyword execution got timeout"))
    }, 10000)// TODO make timeout configurable
    // Handle exceptions for synchronous code using explicit return of throws.
    try {
        params.push(keywordResponse)
        var result = keyword.apply(this, params)
        if (result !== undefined) {
            keywordResponse(result)
        }
    } catch (e) {
        keywordResponse(e)
    }
}

RobotRemoteServer.prototype.getKeywordNames = function (returnCallback) {
    returnCallback(null, Object.keys(this.library))
}

