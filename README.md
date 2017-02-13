
# 如何安装

[Node.js](http://nodejs.org).

[![NPM](https://nodei.co/npm/node-aspect?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/node-aspect/)

npm install node-aspect

---

## 如何使用

```javascript
module.exexports = class Hello {
    say(name) {
        console.log(`hello ${name}`);
        return name;
    }
}
//import
const Aspect = require('node-aspect');
// create Aspect
let aspect = new Aspect('/**/test/**/*.js', `classes`, `name`);
//set [before, after, error, around] handler
aspect.before((name, aspect) => {
    console.log(`before: ${name}`);
});
//start aop
aspect.aop();

const Hello = require('./Hello');
console.log(new Hello().say('Alone'));

// output:
before: Alone
hello Alone
Alone
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

  * `before` - {function(`arguments`)} last arg is this Aspect.
  * `after` - {function(`arguments` + `this Aspect` + `result`)} last arg is this Aspect.
  * `error` - {function(`arguments` + `this Aspect` + `error`)} last arg is this Aspect.
  * `around` - {function(`arguments`)} last arg is this Aspect.

Return this

### aop()

start aop.