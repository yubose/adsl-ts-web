import y from 'yaml'
import { Diagnostics } from '@noodl/core'
import type {
  DiagnosticObject,
  TranslatedDiagnosticObject,
} from '@noodl/core/dist/diagnostics/diagnosticsTypes'
import getJsType from './utils/getJsType'
import getNodeKind from './utils/getNodeKind'
import * as u from '@jsmanifest/utils'
import * as c from './constants'
import * as t from './types'

class DocDiagnostics extends Diagnostics {
  constructor() {
    super()
  }

  createDiagnostic(
    options?: Partial<
      (DiagnosticObject | TranslatedDiagnosticObject) & {
        node?: unknown
      }
    >,
  ) {
    const { node, ...opts } = options || {}
    const diagnostic = super.createDiagnostic(opts)

    if (opts?.node) {
      const kind = getNodeKind(opts.node)
      switch (kind) {
        case c.Kind.Scalar:
        case c.Kind.Pair:
        case c.Kind.Map:
        case c.Kind.Seq: {
          const node = opts.node as y.Scalar | y.Pair | y.YAMLMap | y.YAMLSeq

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
