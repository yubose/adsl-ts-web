import y from 'yaml'
import { AVisitor, fp } from '@noodl/core'
import type { VisitorOptions } from '@noodl/core'

function wrap(callback, { data, name, options }) {
  return async function onVisit(...[key, node, path]) {
    const callbackArgs = {
      ...fp.omit(options, ['init']),
      data,
      name,
      key,
      value: node,
      path,
    }

    const control = await callback?.(callbackArgs)

    if (control != undefined) {
      if (control === y.visitAsync.BREAK) {
        return y.visitAsync.BREAK
      }

      if (control === y.visitAsync.REMOVE) {
        return y.visitAsync.REMOVE
      }

      if (control === y.visitAsync.SKIP) {
        return y.visitAsync.SKIP
      }

      if (y.isNode(control)) {
        return control
      }

      if (typeof control === 'number') {
        return control
      }
    }

    return undefined
  }
}

class DocVisitor extends AVisitor {
  #callback: any

  get callback() {
    return this.#callback
  }

  /**
   * @param { [name: string, doc: y.Document.Parsed]} args
   * @param { Parameters<import('@noodl/core').AVisitor['callback']>[0] } options
   * @returns Visitor data
   */
  visit(args, options: Partial<VisitorOptions>) {
    const [name, value] = args
    const data = options?.data || {}

    options?.init?.({ data })

    if (y.isNode(value) || y.isDocument(value)) {
      // @ts-expect-error
      y.visit(value, wrap(this.callback, { name, data, options }))
    }

    return data
  }

  /**
   * @param { [name: string, doc: y.Document.Parsed]} args
   * @param { Parameters<import('@noodl/core').AVisitor['callback']>[0] } options
   * @returns Visitor data
   */
  async visitAsync(args, options: Partial<VisitorOptions>) {
    const [name, value] = args
    const data = options?.data || {}

    await options?.init?.({ data })

    if (y.isNode(value) || y.isDocument(value)) {
      await y.visitAsync(value, wrap(this.callback, { name, data, options }))
    }

    return data
  }

  use(callback) {
    this.#callback = callback
    return this
  }
}

export default DocVisitor
