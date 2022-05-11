import * as u from '@jsmanifest/utils'
import y from 'yaml'
import { AVisitor } from '@noodl/core'

function wrap(callback, { data, name, options }) {
  return async function onVisit(...[key, node, path]) {
    const callbackArgs: Parameters<AVisitor['callback']>[0] = {
      data,
      name,
      key,
      value: node,
      path,
      ...u.omit(options, ['init']),
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
  #callback

  get callback() {
    return this.#callback
  }

  /**
   * @param { [name: string, doc: y.Document.Parsed]} args
   * @param { Parameters<import('@noodl/core').AVisitor['callback']>[0] } options
   * @returns Visitor data
   */
  visit(args, options) {
    const [name, value] = args
    const data = options?.data || {}

    options?.init?.(data)

    if (y.isNode(value) || y.isDocument(value)) {
      y.visit(value, wrap(this.#callback, { name, value, data, options }))
    }

    return data
  }

  /**
   * @param { [name: string, doc: y.Document.Parsed]} args
   * @param { Parameters<import('@noodl/core').AVisitor['callback']>[0] } options
   * @returns Visitor data
   */
  async visitAsync(args, options) {
    const [name, value] = args
    const data = options?.data || {}

    await options?.init?.(data)

    if (y.isNode(value) || y.isDocument(value)) {
      await y.visitAsync(
        value,
        wrap(this.#callback, { name, value, data, options }),
      )
    }

    return data
  }

  use(callback) {
    this.#callback = callback
    return this
  }
}

export default DocVisitor
