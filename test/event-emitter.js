'use strict';

var assert = require('assert');
var sinon = require('sinon');

describe('EventEmitter', function () {
    it('should add listeners to events', function () {
        var eventEmitter = new global.LoaderUtils.EventEmitter();

        var listener = sinon.stub();
        var listener2 = sinon.stub();

        eventEmitter.on('test', listener);
        eventEmitter.on('test', listener2);

        assert.ok(eventEmitter._events.test);
        assert.strictEqual(0, eventEmitter._events.test.indexOf(listener));

        assert.ok(eventEmitter._events.test);
        assert.strictEqual(1, eventEmitter._events.test.indexOf(listener2));
    });

    it('should invoke liseners on emit', function () {
        var eventEmitter = new global.LoaderUtils.EventEmitter();

        var listener = sinon.stub();
        var listener2 = sinon.stub();

        eventEmitter.on('test', listener);
        eventEmitter.on('test2', listener2);

        eventEmitter.emit('test');

        assert.strictEqual(1, listener.callCount);
        assert.strictEqual(0, listener2.callCount);

        eventEmitter.emit('test2');

        assert.strictEqual(1, listener.callCount);
        assert.strictEqual(1, listener2.callCount);

        var arg = {
            test: 1
        };

        eventEmitter.emit('test', arg);
        assert.strictEqual(2, listener.callCount);
        assert.strictEqual(1, listener2.callCount);
        assert.strictEqual(true, listener.calledWith(arg));
    });

    it('should remove listeners', function () {
        var eventEmitter = new global.LoaderUtils.EventEmitter();

        var listener = sinon.stub();
        var listener2 = sinon.stub();

        eventEmitter.on('test', listener);
        eventEmitter.on('test', listener2);

        eventEmitter.off('test', listener);

        eventEmitter.emit('test');

        assert.strictEqual(0, listener.callCount);
        assert.strictEqual(1, listener2.callCount);

        eventEmitter.off('test', listener2);

        eventEmitter.emit('test');

        assert.strictEqual(1, listener2.callCount);
    });

    it('should warn when detaching non attached listeners', function () {
        var eventEmitter = new global.LoaderUtils.EventEmitter();

        sinon.spy(console, 'warn');

        eventEmitter.off('test', sinon.stub());
        assert(console.warn.called);

        var listener = sinon.stub();
        eventEmitter.on('test', listener);

        eventEmitter.off('test', sinon.stub());
        assert(console.warn.calledTwice);

        console.warn.restore();
    });

    it('should warn when emitting event without listeners', function () {
        var eventEmitter = new global.LoaderUtils.EventEmitter();

        sinon.spy(console, 'warn');
        eventEmitter.emit('test');
        assert(console.warn.called);
        console.warn.restore();
    });
});