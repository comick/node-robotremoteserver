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
        function testKeyword(p1) {
            done();
        }

        var libraries = [
            {testKeyword: testKeyword}
        ];
        var server = new robot.Server(libraries, {host: 'localhost', port: nextPort(), allowStop: true}, function () {
            robot.createClient({host: 'localhost', port: port}).done(
                function (clientKeywords) {
                    clientKeywords.testKeyword('param').done(function (val) {
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
                    val.testKeyword('param').done(function (res) {
                        assert.deepEqual(res, {
                            output: '*WARN* message\n*TRACE* message\n*DEBUG* message\n*INFO* message\n*HTML* message\n',
                            status: 'PASS',
                            return: 'param' });
                        done();
                    }, done);
                }, done
            );
        });
    });
    it('keyword should output continuable and fatal as for error', function (done) {
        var lib = {
            testKeyword: function () {
                var err = new Error();
                err.continuable = true;
                err.fatal = true;
                throw err;
            }
        };
        var server = new robot.Server([lib], {host: 'localhost', port: nextPort(), allowStop: true}, function () {
            robot.createClient({host: 'localhost', port: port}).done(
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
});

