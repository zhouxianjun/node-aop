/**
 * Created by Alone on 2017/2/9.
 */
const Aspect = require('../lib');
Aspect.load = module.exports = class Hello {
    say(name) {
        console.log('hello');
        return name;
    }
};