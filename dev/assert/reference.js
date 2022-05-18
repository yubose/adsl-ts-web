const { createAsserter } = require('./index')

const assertRef = createAsserter(
  (
    { add, node, page, root },
    { n: { consts }, getRefProps, ny: { deref } },
  ) => {
    const derefed = deref({ node: node, root, rootKey: page })
    const refProps = getRefProps(node.value)
    const isLocal = refProps.isLocalRef

    if (!derefed.value) {
      const locLabel = isLocal ? 'Local' : 'Root'
      const messages = []
      const ref = refProps.ref
      const using = isLocal ? ` using root key '${page}'` : ''

      if (root.has(page)) {
        // messages.push({
        //   type: consts.ValidatorType.WARN,
        //   message: `${locLabel} reference '${ref}' resolved to an empty value${using}`,
        // })
      } else {
        messages.push({
          type: consts.ValidatorType.ERROR,
          message: `${locLabel} reference '${ref}' could not be resolved${using}`,
        })
      }

      if (messages.length) {
        add({ messages, node, page, ...refProps })
      }
    }
  },
)

module.exports = assertRef
