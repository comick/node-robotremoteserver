var xmlrpc = require('xmlrpc')

function RobotRemoteServer(libraries, host, port, allowStop) {
	this.host = host
	this.port = port

	// Load libraries
	library = {'stop_remote_server':
		{
			doc: 'Stop remote server',
			args: [],
			impl: this.stopRemoteServer
		}
	}
	libraries.forEach(function(lib) {
		for (kword in lib) {
			library[kword] = lib[kword]
		}
	})
	this.library = library

	this.allowStop = allowStop
	this.server = xmlrpc.createServer({ host: host, port: port })

	// Register functions
	var that = this
	var rpcWrap = function(method) {
		return function(err, params, response) {
			params.push(response)
			method.apply(that, params)
		}
	}
	this.server.on('get_keyword_names', rpcWrap(this.getKeywordNames))
	this.server.on('run_keyword', rpcWrap(this.runKeyword))
	this.server.on('get_keyword_arguments', rpcWrap(this.getKeywordArguments))
	this.server.on('get_keyword_documentation', rpcWrap(this.getKeywordDocumentation))

	// Register signal handlers.
	var handleSignal = function() {
		return function() {
			that.allowStop = true
			that.stopRemoteServer()
		}
	}()
	process.on('SIGHUP', handleSignal)
	process.on('SIGINT', handleSignal)

	console.log('Robot Framework remote server starting at ' + host + ':' + port)
}
exports.RobotRemoteServer = RobotRemoteServer

RobotRemoteServer.prototype.getKeywordDocumentation = function(name, response) {
        response(null, this.library[name].doc)
}

RobotRemoteServer.prototype.getKeywordArguments = function(name, response) {
        response(null, this.library[name].args)
}

RobotRemoteServer.prototype.stopRemoteServer = function(returnCallback) {
	var prefix = 'Robot Framework remote server at ' + this.host + ':' + this.port
        if (this.allowStop) {
        	console.log(prefix + ' stopping')
        	this.server.close()
	} else {
		console.log(prefix + ' does not allow stopping')
	}
        returnCallback(null, true)
}

RobotRemoteServer.prototype.runKeyword = function(name, params, returnCallback) {
	var kword = this.library[name].impl
	var returned = false
	var retFun = function(val) {
		if (returned) return
		returned = true
		var result = {'status': 'PASS', 'output': '', 'traceback': '', 'return': '', 'error': ''}
		if (val instanceof Error) {
			result['traceback'] = val.stack.toString()
			result['status'] = 'FAIL'
			result['error'] = val.toString()	
		} else {
			result['return'] = val
		}
		returnCallback(null, result)
	}
	setTimeout(function() {
		if (!returned) {
			retFun(new Error("Keyword execution got timeout"))
		}
	}, 10000)// TODO make timeout configurable
	// Handle exceptions for synchronous code using explicit return of throws.
	try {
		params.push(retFun)
	 	ret = kword.apply(this, params)
		if (ret != undefined) {
			retFun(ret)
		}
	} catch(e) {
		retFun(e)
	}
}

RobotRemoteServer.prototype.getKeywordNames = function(returnCallback) {
	returnCallback(null, Object.keys(this.library))
}

