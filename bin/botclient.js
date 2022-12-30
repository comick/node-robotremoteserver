#!/usr/bin/env node
'use strict';

const robot = require('../lib/robotremote');
const repl = require('repl');

const options = {
    host: process.argv[2] || 'localhost',
    port: parseInt(process.argv[3], 10) || 8270
};
const serverString = options.host + ':' + options.port;

async function reloadKeywords(serverString) {
    let keywords = await robot.createClient(options);
    console.log('Connected to remote server at "' + serverString + '"');
    console.log('Available keywords: ' + Object.keys(keywords).join(', '));
    return keywords;
}

(async () => {
    try {
        let keywords = await reloadKeywords(serverString);
        const replServer = repl.start(serverString + '> ')
        replServer.context.keywords = keywords;
        replServer.defineCommand('reload', {
            help: 'Reload remote keyword definitions',
            async action() {
                replServer.context.keywords = await reloadKeywords(serverString);
                this.displayPrompt();
            }
        }); 
    } catch (err) {
        console.log('Could not connected to remote server at "' + serverString + '"');
        throw err;
    }
})();

