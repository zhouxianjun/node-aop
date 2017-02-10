/**
 * Created by Alone on 2017/2/9.
 */
const Module = require('module');
const miniMatch = require('minimatch');
module.exports = class Match {
    static isInPackage(m, pattern) {
        if (!(m instanceof Module)) {
            throw new ReferenceError('bean is not Module');
        }
        return miniMatch(m.filename, pattern);
    }

    static isClass(bean, c) {
        return bean instanceof c;
    }

    static name(str, pattern) {
        return miniMatch(str, pattern);
    }
};