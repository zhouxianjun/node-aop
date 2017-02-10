/**
 * Created by Alone on 2017/2/9.
 */
'use strict';
const Match = require('./Match');
const assert = require('assert');
const cache = require('memory-cache');
const Module = require('module');
Reflect.set(Module.prototype, 'require', new Proxy(Module.prototype.require, {
    apply(target, that, args) {
        let module = Reflect.apply(...arguments);
        
        return module;
    }
}));
module.exports = class Aspect {
    constructor(path = false, classes = false, name) {
        this[Symbol.for('path')] = path;
        this[Symbol.for('class')] = classes;
        this[Symbol.for('name')] = name;
        this[Symbol.for('advisor')] = new Set();
    }

    static set load(m) {
        let modules = cache.get('modules') || [];
        modules.push(m);
        cache.put('modules', modules);
    }

    before(handler) {
        assert.strictEqual(typeof handler, 'function');
        this[Symbol.for('before')] = handler;
        return this;
    }

    newProxy(target) {
        let before = this[Symbol.for('before')];
        let error = this[Symbol.for('error')];
        let after = this[Symbol.for('after')];
        return new Proxy(target, {
            apply(target, that, args) {
                if (typeof before == 'function') {
                    Reflect.apply(before, before, args);
                }
                try {
                    let result = Reflect.apply(...arguments);
                    if (typeof after == 'function') {
                        Reflect.apply(after, after, args);
                    }
                    return result;
                } catch (err) {
                    if (typeof error == 'function') {
                        Reflect.apply(error, error, args);
                    }
                    console.error(err);
                }
            }
        });
    }

    advisor(bean) {
        if (!bean || !bean.prototype) {
            new Error('bean has be Object.')
        }
        let classes = this[Symbol.for('class')];
        let name = this[Symbol.for('name')];
        if (!classes || Match.isClass(bean, classes)) {
            Reflect.ownKeys(bean.prototype).forEach(method => {
                let descriptor = Reflect.getOwnPropertyDescriptor(bean.prototype, method);
                if (method != 'constructor' &&
                    descriptor.get === undefined &&
                    descriptor.set === undefined &&
                    typeof descriptor.value == 'function') {

                    let target = bean.prototype[method];
                    let advisor = this[Symbol.for('advisor')];
                    if (!advisor.has(target)) {
                        Reflect.set(bean.prototype, method, this.newProxy(target));
                        advisor.add(target);
                    }
                }
            }, this);
        }
    }

    aop() {
        Reflect.ownKeys(require.cache).forEach(key => {
            let m = require.cache[key];
            if (m.exports.prototype) {
                let path = this[Symbol.for('path')];
                if (!path || Match.isInPackage(m, path)) {
                    this.advisor(m.exports);
                }
            }
        }, this);
    }
};