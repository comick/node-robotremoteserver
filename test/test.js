'use strict';

var assert = require('assert'),
    robot = require('../lib/robotremote'),
    testLibrary = require('./testlibrary');

function keywordsEqual(keywords1, keywords2) {
    assert.deepEqual(Object.keys(keywords1), Object.keys(keywords2));
}
var port = 12345;
function nextPort() {
    return ++port;
}


describe('Robot Remote Library', function () {
    it('client should fail to start if server is not running', function (done) {
        robot.createClient({host: 'localhost', port: nextPort()}).done(
            function (val) {
                throw new Error('client succeeded');
            },
            function (err) {
                done();
            }
        );
    });
    it('client should succeed to start if server is running and list all keywords', function (done) {
        var server = new robot.Server([testLibrary], {host: 'localhost', port: nextPort(), allowStop: true}, function () {
            robot.createClient({host: 'localhost', port: port}).done(
                function (val) {
                    keywordsEqual(val, server.keywords);
                    done();
                }, done
            );
        });
    });
    it('client should call remote keyword', function (done) {
        var lib = {
            testKeyword: function (p1) {
                return p1;
            }
        };
        var server = new robot.Server([lib], {host: 'localhost', port: nextPort(), allowStop: true}, function () {
            robot.createClient({host: 'localhost', port: port}).done(
                function (val) {
                    val.testKeyword('param', function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        assert.deepEqual(res, { output: '', status: 'PASS', return: 'param' });
                        done();
                    });
                }, done
            );
        });
    });
    it('keyword should output correctly', function (done) {
        var lib = {
            testKeyword: function (p1) {
                this.output.warn('message');
                this.output.trace('message');
                this.output.debug('message');
                this.output.info('message');
                this.output.html('message');
                return p1;
            }
        };
        var server = new robot.Server([lib], {host: 'localhost', port: nextPort(), allowStop: true}, function () {
            robot.createClient({host: 'localhost', port: port}).done(
                function (val) {
                    val.testKeyword('param', function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        assert.deepEqual(res, {
                            output: '*WARN* message\n*TRACE* message\n*DEBUG* message\n*INFO* message\n*HTML* message\n',
                            status: 'PASS',
                            return: 'param' });
                        done();
                    });
                }, done
            );
        });
    });
});

