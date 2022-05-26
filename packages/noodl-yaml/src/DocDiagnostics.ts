import { consts, Diagnostic, Diagnostics, is as coreIs, fp } from 'noodl-core'
import type { Builder, TranslatedDiagnosticObject } from 'noodl-core'
import getYamlNodeKind from './utils/getYamlNodeKind'
import DocDiagnosticsIterator from './DocDiagnosticsIterator'
import DocRoot from './DocRoot'
import * as c from './constants'
import * as t from './types'

class DocDiagnostics extends Diagnostics<
  t.YAMLDiagnosticObject,
  t.YAMLDiagnosticObject[],
  { path: number | string | null },
  t.DocVisitorAssertConfig | t.DocVisitorAssertConfig[]
> {
  constructor() {
    super()
  }

  createDiagnostic(
    options?: Partial<t.YAMLDiagnosticObject | TranslatedDiagnosticObject>,
  ) {
    const { node, ...opts } = options ?? {}
    const diagnostic = super.createDiagnostic(opts)

    if (node) {
      const kind = getYamlNodeKind(node)

      switch (kind) {
        case c.Kind.Scalar:
        case c.Kind.Pair:
        case c.Kind.Map:
        case c.Kind.Seq:
        case c.Kind.Document: {
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

  use(value: DocDiagnosticsIterator | Parameters<Builder['use']>[0]) {
    super.use(value)
    if (coreIs.root(value) || value instanceof DocRoot) {
      ;(value as DocRoot).use(new DocDiagnosticsIterator(this))
    }
    return this
  }

  codeExists(
    code: consts.DiagnosticCode,
    diagnostics: Diagnostic | Diagnostic[],
  ) {
    return fp.toArr(diagnostics).some((diagnostic) => {
      if (diagnostic.messages?.some((msg) => msg?.code == code)) {
        return true
      }
      return false
    })
  }
}

export default DocDiagnostics
