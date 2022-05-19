const { createAsserter } = require('../index')

const assertList = createAsserter(
  ({ add, node, page, root }, { n, ny: { deref, is } }) => {
    if (is.mapNode(node)) {
      const listObject = node.get('listObject', true)

      if (is.scalarNode(listObject)) {
        if (is.reference(listObject)) {
          const derefed = deref({
            node: listObject,
            root,
            rootKey: page,
          })

          if (typeof derefed.value === 'undefined') {
            // add({
            console.log({ derefed, root, page, node })
            //   node: listObject,
            //   messages: [
            //     {
            //       type: n.consts.ValidatorType.INFO,
            //       message: `Reference '${derefed.reference}' was not resolvable`,
            //     },
            //   ],
            //   page,
            //   ...derefed,
            // })
          } else {
            const { value, ...derefedInfo } = derefed
            listObject.value = value
            add({
              node: listObject,
              messages: [
                {
                  type: n.consts.ValidatorType.INFO,
                  message: `The reference '${derefed.reference}' was resolved`,
                  value,
                },
              ],
              page,
              ...derefedInfo,
            })
          }
        }
      }
    } else {
      add({
        messages: [
          {
            type: n.consts.ValidatorType.WARN,
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
