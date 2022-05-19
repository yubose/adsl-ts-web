import { Diagnostics } from '@noodl/core'
import type { DiagnosticObject, TranslatedDiagnosticObject } from '@noodl/core'
import getNodeKind from './utils/getNodeKind'
import * as c from './constants'

class DocDiagnostics extends Diagnostics {
  constructor() {
    super()
  }

  createDiagnostic(
    options?: Partial<
      | TranslatedDiagnosticObject
      | (DiagnosticObject & {
          node?: unknown
        })
    >,
  ) {
    const { node, ...opts } = options ?? {}
    const diagnostic = super.createDiagnostic(opts)

    if (node) {
      const kind = getNodeKind(node)

      switch (kind) {
        case c.Kind.Scalar:
        case c.Kind.Pair:
        case c.Kind.Map:
        case c.Kind.Seq: {
          if (node.srcToken) {
            const { indent, items, offset, props, start, end, type } =
              node.srcToken || {}
            const range = node.range
            if (start) diagnostic.set('start', start)
            if (end) diagnostic.set('end', end)
            if (indent) diagnostic.set('indent', indent)
            if (items) diagnostic.set('items', items)
            if (offset) diagnostic.set('offset', offset)
            if (props) diagnostic.set('props', props)
            if (range) diagnostic.set('range', range)
            if (type) diagnostic.set('type', type)
          }
          break
        }
        case c.Kind.Unknown:
      }
    }

    return diagnostic
  }
}

export default DocDiagnostics
