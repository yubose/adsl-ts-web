const { createAsserter } = require('./index')

const assertInit = createAsserter(
  ({ add, node, page }, { n, ny: { is, unwrap } }) => {
    if (is.seqNode(node)) {
      //
    } else if (is.scalarNode(node) && is.reference(node)) {
      //
    } else {
      if (!unwrap(node)) {
        console.log(node)
        add({
          node,
          messages: [
            {
              type: n.consts.ValidatorType.ERROR,
              message: `Init should not be empty`,
            },
          ],
          page,
        })
      } else {
        add({
          node,
          messages: [
            {
              type: n.consts.ValidatorType.WARN,
              message: `Expected an array or reference string but received ${ny.getJsType(
                node,
              )}`,
            },
          ],
          page,
        })
      }
    }
  },
)

module.exports = assertInit
