#!/usr/bin/env node
'use strict';

var robot = require('../lib/robotremote'),
    repl = require('repl');


var options = {host: process.argv[2] || 'localhost', port: parseInt(process.argv[3], 10) || 8270};
var serverString = options.host + ':' + options.port;

robot.createClient(options).then(keywords -> {
    console.log('Connected to remote server at "' + serverString + '"');
    console.log('Available keywords: ' + Object.keys(keywords).join(', '));
    repl.start(serverString + '> ').context.keywords = keywords;
}, err -> {
    console.log('Could not connected to remote server at "' + serverString + '"');
    throw err;
});

