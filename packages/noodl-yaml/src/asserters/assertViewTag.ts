import y from 'yaml'
import { consts, is as coreIs, generateDiagnostic } from 'noodl-core'
import deref from '../utils/deref'
import has from '../utils/has'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import { createAssert } from '../assert'

export default createAssert({
  cond: [is.mapNode, has('viewTag')],
  fn({ add, isValidViewTag, node, markers, page, root }) {
    let viewTag = unwrap(node.get('viewTag')) as string
    const isAction = has('actionType', 'goto', node) || !has('type', node)
    const isComponent = !isAction || has('children', 'style', node)

    if (!isValidViewTag(viewTag)) {
      return void add({
        node,
        messages: [
          {
            type: consts.ValidatorType.ERROR,
            ...generateDiagnostic(consts.DiagnosticCode.VIEW_TAG_INVALID, {
              viewTag,
            }),
          },
        ],
        page,
      })
    }

    if (coreIs.reference(viewTag)) {
      viewTag = unwrap(
        deref({ node: viewTag, root, rootKey: page }).value as string,
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
              if (has('type', 'viewTag', n)) {
                const value = n.get('viewTag', true)
                if (is.reference(value)) {
                  const derefed = deref({ node: value, root, rootKey: page })

                  if (!coreIs.und(derefed.value)) {
                    hasPointer = derefed.value === viewTag
                  }
                } else if (unwrap(value as any) === viewTag) {
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
                consts.DiagnosticCode.VIEW_TAG_MISSING_COMPONENT_POINTER,
                { viewTag },
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
