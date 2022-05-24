import y from 'yaml'
import { AVisitor, is as coreIs } from '@noodl/core'
import type { VisitorInitArgs, VisitorOptions, VisitFnArgs } from '@noodl/core'
import is from './utils/is'
import { isScalar, isPair, isMap, isSeq } from './utils/yaml'
import {
  getScalarKind,
  getScalarType,
  getNodeKind,
  getMapKind,
  getIfNodeItemKind,
  getSeqKind,
} from './compiler/utils'
import type DocRoot from './DocRoot'
import * as c from './constants'
import * as t from './types'

export type State = typeof _state

const _state = {
  sync: { history: [], queue: [] } as t.VisitorState,
  async: { history: [], queue: [] } as t.VisitorState,
}

function wrap(callback, { data, name, options }) {
  return async function onVisit(...[key, node, path]) {
    const callbackArgs = {
      ...u.omit(options, ['init']),
      data,
      name,
      key,
      value: node,
      path,
    }

    const control = await callback?.(callbackArgs)

function createId() {
  return Math.random().toString(36).substring(2)
}

function decorate() {
  const wrapDecoratedVisitFn = function wrappedDecoratedVisitFn(
    wrappedFn,
    isAsync: boolean,
  ) {
    return function wrappedVisit<N = unknown>(
      this: AVisitor,
      node: N,
      args: VisitFnArgs,
      state?: {
        calledInit?: boolean
      },
    ) {
      const { data, helpers, init, root } = args || {}
      const initArgs = { data, ...helpers, root } as VisitFnArgs

      if (isAsync) {
        if (!state?.calledInit && init) {
          const wrapperArgs = { ...state, calledInit: true }
          return init(initArgs)
            .then(() => wrappedVisit.call(this, node, args, wrapperArgs))
            .catch((error: unknown) => {
              throw error instanceof Error ? error : new Error(String(error))
            })
        }
      } else {
        init?.(initArgs)
      }
      if (y.isNode(node) || y.isDocument(node)) {
        const visitFn = wrappedFn.call(null, node, args)
        if (coreIs.promise(visitFn)) {
          return visitFn.then((fn) =>
            fn(node, wrap(this.callback as any, isAsync, args)),
          )
        }
        return visitFn(node, wrap(this.callback as any, isAsync, args))
      }

      if (control === y.visitAsync.REMOVE) {
        return y.visitAsync.REMOVE
      }

export type DocVisitorCallback<Fn extends t.AssertAsyncFn | t.AssertFn> = Fn

function wrap<Fn extends t.AssertAsyncFn | t.AssertFn>(
  enter: DocVisitorCallback<Fn>,
  isAsync: boolean,
  {
    data,
    page,
    root,
    helpers,
  }: Pick<VisitFnArgs, 'data' | 'page' | 'root'> & VisitorOptions,
) {
  function onEnter<N = unknown>({
    clearState,
    getState,
    isAsync,
    data,
    node,
    root,
    key,
    path,
    page,
  }: t.VisitorStateHelpers &
    VisitFnArgs<Record<string, any>, N> & {
      path: Parameters<y.visitorFn<N>>[2]
    }) {
    const getCurrentState = () => getState(isAsync ? 'async' : 'sync')

    if (isScalar(node)) {
      const scalarKind = getScalarKind(node)
    } else if (isPair(node)) {
      //
    } else if (isMap(node)) {
      const mapKind = getMapKind(node)
      switch (mapKind) {
        case c.MapKind.Action:
        case c.MapKind.BuiltInFn:
        case c.MapKind.Component:
        case c.MapKind.Emit:
        case c.MapKind.Goto:
        case c.MapKind.If: {
          const q = { id: createId() } as t.VisitorQueueObject
          q.kind = mapKind
          q.node = node
          q.status = c.VisitorQueueStatus.Pending
          getCurrentState().queue.push(q)
          break
        }
        case c.MapKind.Style:
        default:
          break
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
