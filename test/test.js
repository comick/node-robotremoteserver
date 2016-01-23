'use strict';

var assert = require('assert'),
    util = require('util'),
    robot = require('../lib/robotremote'),
    testLibrary = require('./testlibrary'),
    describe = require('mocha').describe,
    it = require('mocha').it;

function keywordsEqual(keywords1, keywords2) {
    assert.deepEqual(Object.keys(keywords1), Object.keys(keywords2));
}
function nextPort() {
    return nextPort.port++;
}
nextPort.port = 12345;

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
    it('client should start and list all keywords when server is running', function (done) {
        var serverPort = nextPort();
        var server = new robot.Server([testLibrary], {host: 'localhost', port: serverPort, allowStop: true}, function () {
            robot.createClient({host: 'localhost', port: serverPort}).done(
                function (val) {
                    keywordsEqual(val, server.keywords);
                    done();
                }, done
            );
        });
    });
    it('keyword should run when called by a client', function (done) {
        var serverPort = nextPort();

        function testKeyword(p1) {
            done();
        }

        var libraries = [
            {testKeyword: testKeyword}
        ];
        var server = new robot.Server(libraries, {host: 'localhost', port: serverPort, allowStop: true}, function () {
            robot.createClient({host: 'localhost', port: serverPort}).done(
                function (clientKeywords) {
                    clientKeywords.testKeyword('param').done(function (val) {
                    });
                }, done
            );
        });
    });
    it('keyword should output correctly', function (done) {
        var serverPort = nextPort();
        var twarn, ttrace, tdebug, tinfo, thtml;
        var lib = {
            testKeyword: function (p1) {
                twarn = this.output.warn('message');
                ttrace = this.output.trace('message');
                tdebug = this.output.debug('message');
                tinfo = this.output.info('message');
                thtml = this.output.html('message');
                return p1;
            }
        };
        var server = new robot.Server([lib], {host: 'localhost', port: serverPort, allowStop: true}, function () {
            robot.createClient({host: 'localhost', port: serverPort}).done(
                function (val) {
                    val.testKeyword('param').done(function (res) {
                        assert.deepEqual(res, {
                            output: util.format('*WARN:%d* message\n*TRACE:%d* message\n*DEBUG:%d* message\n*INFO:%d* message\n*HTML:%d* message\n', twarn, ttrace, tdebug, tinfo, thtml),
                            status: 'PASS',
                            return: 'param' });
                        done();
                    }, done);
                }, done
            );
        });
    });
    it('should output continuable and fatal as for failing keyword error', function (done) {
        var serverPort = nextPort();
        var lib = {
            testKeyword: function () {
                var err = new Error();
                err.continuable = true;
                err.fatal = true;
                throw err;
            }
        };
        var server = new robot.Server([lib], {host: 'localhost', port: serverPort, allowStop: true}, function () {
            robot.createClient({host: 'localhost', port: serverPort}).done(
                function (val) {
                    val.testKeyword().done(done, function (err) {
                        assert.equal(true, err.continuable);
                        assert.equal(true, err.fatal);
                        done();
                    });
                }, done
            );
        });
    });
    it('should load keywords from all libraries', function (done) {
        var serverPort = nextPort();
        var lib1 = {
            testKeywordFromLib1: function () {
                return true;
            }
        };
        var lib2 = {
            testKeywordFromLib2: function () {
                return true;
            }
        };
        var server = new robot.Server([lib1, lib2], {host: 'localhost', port: serverPort, allowStop: true}, function () {
            robot.createClient({host: 'localhost', port: serverPort}).done(
                function (val) {
                    val.testKeywordFromLib1().done(function () {
                    }, done);
                    val.testKeywordFromLib2().done(function (val) {
                        done();
                    }, done);
                }, done
            );
        });
    });
});

