# `@noodl/yaml`

> YAML Bindings for @noodl/core

## Usage

```js
const { Diagnostics } = require('@noodl/core')
const { DocRoot, DocVisitor, DocIterator } = require('@noodl/yaml')

const root = new DocRoot()
const visitor = new DocVisitor()
const iterator = new DocIterator()
const diagnostics = new Diagnostics()

diagnostics.use(root)
diagnostics.use(visitor)

diagnostics.run().then((results) => {
  console.log(results)
})
```
