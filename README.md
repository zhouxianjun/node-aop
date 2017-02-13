
# 如何安装

[Node.js](http://nodejs.org).

[![NPM](https://nodei.co/npm/simple-net.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/simple-net/)

npm install node-aop

---

## 如何使用

```javascript
//import
const Aspect = require('node-aop');
// create Aspect
let aspect = new Aspect(path, classes, name);
//set [before, after, error, around] handler
aspect.before(handler);
//start aop
aspect.aop();
```

## API

### handler(`type`, `handler`)

Set handler.

* `type` - (String) aop handler type:

  * `before` - (String) target method before called.
  * `after` - (String) target method after return called.
  * `error` - (String) target method error called.
  * `around` - (String) target method around called.

* `handler` - (Function) aop handler function:


Return this

### aop()

start aop.