/**
 * Created by Alone on 2017/2/9.
 */
'use strict';
const Aspect = require('../lib');
let aspect = new Aspect('E:/**/node-aop/**/*.js');
aspect.before(() => {
    console.log('before', [...arguments].slice(0, 1));
}).around((target, bean, args) => {
    console.log('around');
    Reflect.apply(target, bean, args);
}).aop();

const Hello = require('./Hello');
new Hello().say();