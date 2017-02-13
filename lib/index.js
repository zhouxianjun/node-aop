/**
 * Created by Alone on 2017/2/9.
 */
'use strict';
const Match = require('./Match');
const assert = require('assert');
const cache = require('memory-cache');
const uuid = require('uuid');
const Module = require('module');
const allAspect = Symbol();
function addAspect(aspect) {
    if (aspect && aspect instanceof Aspect && aspect.isAop) {
        let aspects = cache.get(allAspect) || new Map();
        if (!aspects.has(aspect.id)) {
            aspects.set(aspect.id, aspect);
            cache.put(allAspect, aspects);
        }
    }
}
function getModule(module) {
    let result = null;
    Reflect.ownKeys(require.cache).forEach(key => {
        let m = require.cache[key];
        if (m.exports == module) {
            result = m;
        }
    }, this);
    return result;
}
Reflect.set(Module.prototype, 'require', new Proxy(Module.prototype.require, {
    apply(target, that, args) {
        let module = Reflect.apply(...arguments);
        try {
            let m = getModule(module);
            if (m) {
                let aspects = cache.get(allAspect) || new Map();
                for (let aspect of aspects.values()) {
                    aspect.advisorModule(m);
                }
            }
        } catch (err) {
            console.error(err);
        }
        return module;
    }
}));
const Aspect = class Aspect {
    constructor(path = false, classes = false, name) {
        this[Symbol.for('path')] = path;
        this[Symbol.for('class')] = classes;
        this[Symbol.for('name')] = name;
        this[Symbol.for('advisor')] = new Set();
        this.isAop = false;
        this.id = uuid();
    }
    
    handler(type, handler) {
        assert.strictEqual(typeof handler, 'function');
        ['around', 'before', 'after', 'error'].indexOf(type);
        this[Symbol.for(type)] = handler;
        return this;
    }

    around(handler) {
        return this.handler('around', handler);
    }

    before(handler) {
        return this.handler('before', handler);
    }

    after(handler) {
        return this.handler('after', handler);
    }

    error(handler) {
        return this.handler('error', handler);
    }

    newProxy(target) {
        let before = this[Symbol.for('before')];
        let error = this[Symbol.for('error')];
        let after = this[Symbol.for('after')];
        let around = this[Symbol.for('around')];
        let aspect = this;
        return new Proxy(target, {
            apply(target, bean, args) {
                if (typeof around == 'function') {
                    return Reflect.apply(around, bean, [target, bean, args.concat(aspect)]);
                }
                if (typeof before == 'function') {
                    Reflect.apply(before, bean, args.concat(aspect));
                }
                try {
                    let result = Reflect.apply(...arguments);
                    if (typeof after == 'function') {
                        Reflect.apply(after, bean, args.concat(aspect, result));
                    }
                    return result;
                } catch (err) {
                    if (typeof error == 'function') {
                        Reflect.apply(error, bean, args.concat(aspect, err));
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
        if (bean instanceof Aspect || bean == Aspect) {
            return;
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
                        console.info(`Aop: ${bean} method:${method}`);
                        Reflect.set(bean.prototype, method, this.newProxy(target));
                        advisor.add(target);
                    }
                }
            }, this);
        }
    }

    advisorModule(m) {
        if (m.exports.prototype) {
            let path = this[Symbol.for('path')];
            if (!path || Match.isInPackage(m, path)) {
                this.advisor(m.exports);
            }
        }
    }

    aop() {
        Reflect.ownKeys(require.cache).forEach(key => {
            let m = require.cache[key];
            this.advisorModule(m);
        }, this);
        this.isAop = true;
        addAspect(this);
    }
};
module.exports = Aspect;