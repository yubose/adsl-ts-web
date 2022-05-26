import y from 'yaml'
import { consts, is as coreIs, generateDiagnostic } from 'noodl-core'
import deref from '../utils/deref'
import has from '../utils/has'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import { createAssert } from '../assert'
import * as t from '../types'

export default createAssert<y.YAMLMap<'popUpView'>>({
  cond: [is.mapNode, has('popUpView')],
  fn({ add, isValidViewTag, node, markers, page, root }) {
    let popUpView = unwrap(node.get('popUpView')) as string
    const isAction = has('actionType', 'goto', node) || !has('type', node)
    const isComponent = !isAction || has('children', 'style', node)

    if (!isValidViewTag(popUpView)) {
      return void add({
        node,
        messages: [
          {
            type: consts.ValidatorType.ERROR,
            ...generateDiagnostic(consts.DiagnosticCode.POPUP_VIEW_INVALID, {
              popUpView,
            }),
          },
        ],
        page,
      })
    }

    if (coreIs.reference(popUpView)) {
      popUpView = unwrap(
        deref({ node: popUpView, root, rootKey: page }).value as string,
      )
    }

    if (isAction) {
      const pageDoc = root.get(page as string) as y.Document
      let hasPointer = false

      if (pageDoc) {
        const components = pageDoc.get('components') as y.YAMLSeq
        if (components) {
          y.visit(components, {
            Map: (k, n) => {
              if (hasPointer) return
              if (has('type', 'popUpView', n)) {
                const value = n.get('popUpView', true)
                if (is.reference(value)) {
                  const derefed = deref({ node: value, root, rootKey: page })

                  if (!coreIs.und(derefed.value)) {
                    hasPointer = derefed.value === popUpView
                  }
                } else if (unwrap(value as any) === popUpView) {
                  hasPointer = true
                }
              }
            },
          })
        }
      }

      if (!hasPointer) {
        add({
          node,
          messages: [
            {
              type: consts.ValidatorType.ERROR,
              ...generateDiagnostic(
                consts.DiagnosticCode.POPUP_VIEW_MISSING_COMPONENT_POINTER,
                { popUpView },
              ),
            },
          ],
          page,
        })
      }
    } else if (isComponent) {
      //
    }
  },
})
