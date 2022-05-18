const { createAsserter } = require('../index')

const assertList = createAsserter(
  ({ add, node, page }, { n, getRefProps, ny: { is } }) => {
    if (is.mapNode(node)) {
      const listObject = node.get('listObject', true)

      if (is.scalarNode(listObject)) {
        if (is.reference(listObject)) {
          const refProps = getRefProps(listObject.value)
          if (!refProps.value) {
            add({
              node: listObject,
              messages: [
                {
                  type: n.consts.ValidatorType?.INFO,
                  message: `A list component is using its listObject as a reference`,
                },
              ],
              page,
              ...refProps,
            })
          }
        }
      }
    } else {
      add({
        messages: [
          {
            type: n.consts.ValidatorType?.WARN,
            message: `List components should be an object`,
          },
        ],
        node,
        page,
      })
    }
  },
)

module.exports = assertList
