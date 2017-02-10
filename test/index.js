/**
 * Created by Alone on 2017/2/9.
 */
'use strict';
const Aspect = require('../lib');
const Hello = require('./Hello');
let aspect = new Aspect('E:/**/node-aop/**/*.js');
/*aspect.before(() => {
    console.log('before');
}).aop();*/
//new Hello().say();