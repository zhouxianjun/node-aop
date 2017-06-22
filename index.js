/**
 * Created by Alone on 2017/2/9.
 */
'use strict';
const Match = require('./lib/Match');
const assert = require('assert');
const cache = require('memory-cache');
const uuid = require('uuid');
const domain = require('domain');
const Module = require('module');
const exclude = ['constructor', 'length', 'name', 'prototype'];
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
        if (m.exports === module) {
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
        if (this.isAop) return this;
        assert.strictEqual(typeof handler, 'function');
        ['around', 'before', 'after', 'error'].indexOf(type);
        let handlers = this[Symbol.for(type)] || new Set();
        handlers.add(handler);
        this[Symbol.for(type)] = handlers;
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
                let ctx = {};
                if (around && around.size) {
                    let result;
                    for (let item of around.values()) {
                        result = Reflect.apply(item, bean, [target, bean, aspect, ctx, result, args]);
                    }
                    return result;
                }
                if (before && before.size) {
                    for (let item of before.values()) {
                        Reflect.apply(item, bean, args.concat(aspect, ctx));
                    }
                }
                let d = domain.create();
                d.on('error', err => {
                    if (error && error.size) {
                        for (let item of error.values()) {
                            Reflect.apply(item, bean, args.concat(aspect, ctx, err));
                        }
                    }
                });
                return d.run(() => {
                    let result = Reflect.apply(...arguments);
                    if (after && after.size) {
                        for (let item of after.values()) {
                            Reflect.apply(item, bean, args.concat(aspect, ctx, result));
                        }
                    }
                    return result;
                });
            }
        });
    }

    advisor(bean) {
        if (!bean || !bean.prototype) {
            new Error('bean has be Object.')
        }
        if (bean instanceof Aspect || bean === Aspect) {
            return;
        }
        let classes = this[Symbol.for('class')];
        let name = this[Symbol.for('name')];
        if (!classes || Match.isClass(bean, classes)) {
            this.proxy(bean);
            this.proxy(bean.prototype);
        }
    }

    proxy(bean) {
        Reflect.ownKeys(bean).forEach(method => {
            let descriptor = Reflect.getOwnPropertyDescriptor(bean, method);
            if (!exclude.includes(method) &&
                descriptor.get === undefined &&
                descriptor.set === undefined &&
                typeof descriptor.value === 'function' &&
                (!name || Match.name(method, name))) {

                let target = bean[method];
                let advisor = this[Symbol.for('advisor')];
                if (!advisor.has(target)) {
                    console.info(`Aop: ${bean} method:${method}`);
                    Reflect.set(bean, method, this.newProxy(target));
                    advisor.add(target);
                }
            }
        }, this);
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