import y from 'yaml'
import { AVisitor, is as coreIs } from '@noodl/core'
import type { VisitorOptions, VisitFnArgs } from '@noodl/core'
import type DocRoot from './DocRoot'
import * as t from './types'

export type DocVisitorCallback<Fn extends t.AssertAsyncFn | t.AssertFn> = Fn

function wrap<Fn extends t.AssertAsyncFn | t.AssertFn>(
  callback: DocVisitorCallback<Fn>,
  {
    data,
    page,
    root,
    helpers,
  }: Pick<VisitFnArgs, 'data' | 'page' | 'root'> & VisitorOptions,
) {
  const getControl = (control: ReturnType<Fn>) => {
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

  const onVisit = function onVisit(...[key, node, path]) {
    const callbackArgs = {
      ...helpers,
      data,
      key,
      node,
      path,
      page,
      root,
    }

    // @ts-expect-error
    const result = callback?.(callbackArgs)

    if (coreIs.promise(result)) {
      return result
        .then((control) => getControl(control as ReturnType<Fn>))
        .catch((error) => {
          throw error instanceof Error ? error : new Error(String(error))
        })
    }

    return getControl(result as ReturnType<Fn>)
  }

  return onVisit
}

class DocVisitor extends AVisitor {
  #callback: any

  get callback() {
    return this.#callback
  }

  /**
   * @param visitee - The node we are visiting
   * @param { Parameters<import('@noodl/core').AVisitor['callback']>[0] } options
   * @returns Visitor data
   */
  visit(
    visitee: [name: string, node: unknown],
    { helpers, init, data = {}, root }: VisitorOptions & { root: DocRoot },
  ) {
    const [name, value] = visitee

    init?.({ data, ...helpers, root })

    if (y.isNode(value) || y.isDocument(value)) {
      y.visit(
        value,
        wrap(this.callback, {
          data,
          helpers,
          page: name,
          root,
        }),
      )
    }

    return data
  }

  /**
   * @param { [name: string, node: unknown]} visitee
   * @param { Parameters<import('@noodl/core').AVisitor['callback']>[0] } options
   * @returns Visitor data
   */
  async visitAsync(
    visitee: [name: string, node: unknown],
    { data = {}, init, root, helpers }: VisitorOptions & { root: DocRoot },
  ) {
    const [name, node] = visitee

    if (init) await init({ data, ...helpers, root })

    if (y.isNode(node) || y.isDocument(node)) {
      await y.visitAsync(
        node,
        wrap(this.callback, { data, helpers, page: name, root }),
      )
    }

    return data
  }

  use<Fn extends t.AssertAsyncFn | t.AssertFn>(
    callback: DocVisitorCallback<Fn>,
  ) {
    this.#callback = callback
    return this
  }
}

export default DocVisitor
