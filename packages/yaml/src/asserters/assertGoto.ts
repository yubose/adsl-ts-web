import y from 'yaml'
import { consts, is as coreIs, generateDiagnostic } from '@noodl/core'
import createNode from '../utils/createNode'
import deref from '../utils/deref'
import get from '../utils/get'
import set from '../utils/set'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import type DocRoot from '../DocRoot'
import { createAssert } from '../assert'
import * as t from '../types'

export default createAssert(function assertRef({
  add,
  node,
  markers,
  page,
  root,
}) {
  const gotoNode = node as t.Goto
  const destinationNode = gotoNode.get('goto', true)
  const destination = unwrap(destinationNode)

  if (coreIs.str(destination)) {
    if (coreIs.reference(destination)) {
      const derefed = deref({ node: destinationNode, root, rootKey: page })
      if (!derefed.value) {
        add({
          node: destinationNode,
          messages: [
            {
              type: consts.ValidatorType.ERROR,
              ...generateDiagnostic(
                consts.DiagnosticCode.REFERENCE_UNRESOLVABLE,
                { ref: destination },
              ),
            },
          ],
          page,
        })
      }
    } else {
      const pages = markers?.pages || []
      // TODO - Narrow destination if it is a ref
      if (!pages.includes(destination)) {
        add({
          node: gotoNode,
          messages: [
            {
              type: consts.ValidatorType.ERROR,
              ...generateDiagnostic(
                consts.DiagnosticCode.GOTO_PAGE_MISSING_FROM_APP_CONFIG,
                { destination },
              ),
            },
          ],
          page,
        })
      }
    }
  } else if (is.mapNode(destinationNode)) {
    if (destinationNode.has('destination')) {
      //
    } else {
      // add({
      //   node: gotoValue,
      //   messages: [],
      //   page,
      // })
    }
  }
})
