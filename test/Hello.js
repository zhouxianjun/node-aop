/**
 * Created by Alone on 2017/2/9.
 */
const Aspect = require('../lib');
Aspect.load = module.exports = class Hello {
    say() {
        console.log('hello');
    }
};