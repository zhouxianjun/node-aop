/**
 * Created by Alone on 2017/2/9.
 */
'use strict';
const Aspect = require('../lib');
let aspect = new Aspect('E:/**/node-aop/**/*.js');
aspect.before(() => {
    console.log('before');
}).before(() => {
    console.log('before2');
}).aop();

const Hello = require('./Hello');
let name = new Hello().say('Alone');
console.log(name);