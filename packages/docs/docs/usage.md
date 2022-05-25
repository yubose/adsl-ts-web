---
id: usage
sidebar_position: 2
---

# Usage

```js
const Builder = require('noodl-builder')

const builder = new Builder()

const myObject = builder.object()
const myObjectStyleProperty = myObject.createProperty('style')

myObjectStyleProperty.setValue(builder.object())
```
