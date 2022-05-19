const { createAsserter } = require('./index')

/**
 * TODOS:
 *  - A component cannot have a "text" and "textBoard" property because they both overlap. The "text" will take precedence.
 */

const assertTextBoard = createAsserter(
  ({ add, node, page, root }, { n, getRefProps, ny: { deref, is } }) => {
    const textBoardComponentNode = node.get('textBoard', false)

    if (is.mapNode(textBoardComponentNode)) {
      const textBoardNode = textBoardComponentNode.get('textBoard')

      if (is.seqNode(textBoardNode)) {
        for (const item of textBoardNode.items) {
          if (is.scalarNode(item)) {
            //
          } else if (is.mapNode(item)) {
            if (item.has('text')) {
              //
            }
          }
        }
      } else if (is.scalarNode(textBoardNode)) {
        if (is.reference(textBoardNode)) {
          // Assert resolvable reference
        } else {
          //
        }
      } else {
        // Error
      }
    } else if (is.scalarNode(textBoardComponentNode)) {
      if (is.reference(textBoardComponentNode)) {
        // Assert resolvable reference
      } else {
        // Error
      }
    } else {
      // Error
    }
  },
)

module.exports = assertTextBoard
