import y from 'yaml'
import {
  consts,
  is as coreIs,
  generateDiagnostic,
  getRefProps,
} from '@noodl/core'
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
  const ref = unwrap(node) as string
  if (ref.startsWith('=.builtIn.')) return
  const refProps = getRefProps(ref)

  if (coreIs.tildeReference(ref)) {
    const value = markers.baseUrl + ref.slice(2)
    if (is.scalarNode(node)) node.value = value
    else node = createNode(value as typeof node)
    return node
  }

  const derefed = deref({ node, root: root as DocRoot, rootKey: page })

  if (!refProps.isLocalRef) {
    const nextWord = refProps.paths[1]
    if (coreIs.str(nextWord)) {
      const char = nextWord.charAt(0)
      if (char.toUpperCase() === char) {
        add({
          node,
          messages: [
            {
              type: consts.ValidatorType.WARN,
              ...generateDiagnostic(
                consts.DiagnosticCode.ROOT_REFERENCE_SECOND_LEVEL_KEY_UPPERCASE,
                { ref: refProps.ref, key: nextWord },
              ),
            },
          ],
          page,
        })
      }
    }
  }

  if (coreIs.und(derefed.value)) {
    const isLocal = coreIs.localReference(derefed.reference)
    const locLabel = isLocal ? 'Local' : 'Root'
    const using = isLocal ? ` using root key '${page}'` : ''

    const messages = [
      {
        type: consts.ValidatorType.ERROR,
        message: `${locLabel} reference '${derefed.reference}' was not resolvable${using}`,
        results: derefed.results,
      },
    ]

    add({
      node,
      messages,
      page,
    })

    return y.visit.SKIP
  } else {
    // add({
    //   page,
    //   messages: [
    //     {
    //       type: consts.ValidatorType.INFO,
    //       message: `Reference "${derefed.reference}" resolved`,
    //     },
    //   ],
    // })
    if (is.scalarNode(node)) {
      node.value = unwrap(derefed.value)
    } else {
      return createNode(derefed.value)
    }
  }
})
