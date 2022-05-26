import { consts, is as coreIs, generateDiagnostic, regex } from 'noodl-core'
import { Parser } from 'noodl-utils'
import type { DiagnosticObjectMessage } from 'noodl-core'
import deref from '../utils/deref'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import { createAssert } from '../assert'
import * as t from '../types'

export default createAssert({
  cond: [is.mapNode, is.goto as any],
  fn({ add, isValidPageValue, isValidViewTag, node, markers, page, root }) {
    const gotoNode = node as t.Goto
    const destinationNode = gotoNode.get('goto', true)
    const destination = unwrap(destinationNode)

    if (!destination) {
      return void add({
        node: destinationNode,
        messages: [
          {
            type: consts.ValidatorType.ERROR,
            ...generateDiagnostic(consts.DiagnosticCode.GOTO_PAGE_EMPTY),
          },
        ],
        page,
      })
    }

    if (coreIs.str(destination)) {
      if (coreIs.pageComponentUrl(destination)) {
        const parsed = new Parser().destination(destination)
        const messages = [] as DiagnosticObjectMessage[]

        for (const [value, type] of [
          [parsed.currentPage, 'currentPage'],
          [parsed.targetPage, 'targetPage'],
          [parsed.viewTag, 'viewTag'],
        ] as const) {
          if (type === 'viewTag') {
            if (!isValidViewTag(value)) {
              messages.push({
                type: consts.ValidatorType.ERROR,
                ...generateDiagnostic(consts.DiagnosticCode.VIEW_TAG_INVALID, {
                  viewTag: value,
                }),
              })
            }
          }

          if (!isValidPageValue(value)) {
            const code =
              type === 'currentPage'
                ? consts.DiagnosticCode
                    .GOTO_PAGE_COMPONENT_URL_CURRENT_PAGE_INVALID
                : type === 'targetPage'
                ? consts.DiagnosticCode
                    .GOTO_PAGE_COMPONENT_URL_TARGET_PAGE_INVALID
                : type === 'viewTag'
                ? consts.DiagnosticCode.GOTO_PAGE_COMPONENT_URL_VIEW_TAG_INVALID
                : undefined
            if (code) {
              messages.push({
                type: consts.ValidatorType.ERROR,
                ...generateDiagnostic(code, { destination, page }),
              })
            }
          } else {
            if (!root.has(value)) {
              messages.push({
                type: consts.ValidatorType.ERROR,
                ...generateDiagnostic(
                  consts.DiagnosticCode.GOTO_PAGE_MISSING_FROM_ROOT,
                  { page: value },
                ),
              })
            }
            if (!markers.pages.includes(value)) {
              messages.push({
                type: consts.ValidatorType.ERROR,
                ...generateDiagnostic(
                  consts.DiagnosticCode.GOTO_PAGE_MISSING_FROM_APP_CONFIG,
                  { destination: value },
                ),
              })
            }
          }
        }

        if (messages.length) {
          add({
            node,
            messages,
            page,
          })
        }
      } else {
        if (coreIs.reference(destination)) {
          // @ts-expect-error
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
  },
})
