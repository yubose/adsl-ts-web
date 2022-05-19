const { createAsserter } = require('./index')

const assertRef = createAsserter(
  (
    { add, node, page, root },
    { n: { consts, is: coreIs }, getRefProps, ny: { deref } },
  ) => {
    const derefed = deref({ node: node, root, rootKey: page })
    const isLocal = coreIs.localReference(derefed.reference)

    if (typeof derefed.value === 'undefined') {
      const locLabel = isLocal ? 'Local' : 'Root'
      const using = isLocal ? ` using root key '${page}'` : ''

      add({
        node,
        messages: [
          {
            type: consts.ValidatorType.INFO,
            message: `${locLabel} reference '${derefed.reference}' was not resolvable${using}`,
          },
        ],
        page,
        ...derefed,
      })
    } else {
      node.value = derefed.value
      return node
    }
  },
)

module.exports = assertRef
