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
			result = method.apply(that, params)
			response(null, result)
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

RobotRemoteServer.prototype.getKeywordDocumentation = function(name) {
        return this.library[name].doc
}

RobotRemoteServer.prototype.getKeywordArguments = function(name) {
        return this.library[name].args
}

RobotRemoteServer.prototype.stopRemoteServer = function() {
	var prefix = 'Robot Framework remote server at ' + this.host + ':' + this.port
        if (this.allowStop) {
        	console.log(prefix + ' stopping')
        	this.server.close()
	} else {
		console.log(prefix + ' does not allow stopping')
	}
        return true
}

RobotRemoteServer.prototype.runKeyword = function(name, params) {
	var result = {'status': 'PASS', 'output': '', 'traceback': '', 'return': '', 'error': ''}
	var kword = this.library[name].impl
	try {
		result['return'] = kword.apply(this, params)
	} catch (e) {
		result['traceback'] = e.stack.toString()
		result['status'] = 'FAIL'
		result['error'] = e.toString()
	}
	return result
}

RobotRemoteServer.prototype.getKeywordNames = function() {
	return Object.keys(this.library)
}

