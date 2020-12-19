import { ComponentInstance, NOODL as NOODLUI } from 'noodl-ui'
import NOODLUIDOMInternal from './Internal'
import * as T from './types'

const createResolver = function createResolver() {
  const _internal: {
    objs: T.NodeResolverConfig[]
    noodlui: NOODLUI
    noodluidom: any
  } = {
    objs: [],
    // @ts-expect-error
    noodlui: undefined,
    noodluidom: undefined,
  }

  const util = {
    options: (...args: T.NodeResolverBaseArgs) =>
      ({
        original: args[1].original,
        noodlui: _internal.noodlui,
        redraw: _internal.noodluidom.redraw,
      } as T.NodeResolverOptions),
  }

  // const middlewares = [] as any[]

  // const _middlewareResolver = (...args: T.NodeResolverBaseArgs) => {
  //   return () => middlewares.forEach((fn) => fn(...args))
  // }

  function _run(
    runner: <N extends T.NOODLDOMElement = any>(
      configs: T.NodeResolverConfig[],
      node: T.NodeResolverBaseArgs<N, any>[0],
      component: T.NodeResolverBaseArgs<N, any>[1],
    ) => void,
  ) {
    return (...args: T.NodeResolverBaseArgs) => {
      return runner(_internal.objs, ...args)
    }
  }

  function _isResolverConfig(value: any): value is T.NodeResolverConfig {
    return (
      !!value &&
      typeof value === 'object' &&
      typeof value.resolve === 'function'
    )
  }

  function _isComponentEvent(
    type: T.NOODLDOMComponentEvent,
    component: ComponentInstance,
  ) {
    return type === component?.noodlType || type === component?.type
  }

  function _getRunners(
    configs: T.NodeResolverConfig[],
    ...args: T.NodeResolverBaseArgs
  ) {
    const attach = (
      acc: T.NodeResolverRunner[],
      obj: T.NodeResolverConfig,
      fn: T.NodeResolverRunner,
    ) => {
      if (typeof obj.cond === 'string') {
        // If they passed in a resolver strictly for this node/component
        if (_isComponentEvent(obj.cond, args[1])) acc.push(fn)
      } else if (typeof obj.cond === 'function') {
        // If they only want this resolver depending on a certain condition
        if (obj.cond(...args, util.options(...args))) acc.push(fn)
      }
    }
    return configs.reduce(
      (acc, obj) => {
        if (obj.before) attach(acc.before, obj, obj.before)
        if (obj.resolve) attach(acc.resolve, obj, obj.resolve)
        if (obj.after) attach(acc.after, obj, obj.after)
        return acc
      },
      {
        before: [],
        resolve: [],
        after: [],
      } as T.NodeResolverLifecycle,
    )
  }

  const o = {
    register(obj: T.NodeResolverConfig) {
      if (!_internal.objs.includes(obj)) _internal.objs.push(obj)
      return o
    },
    run: _run((configs, node, component) => {
      const { before, resolve, after } = _getRunners(configs, node, component)
      const runners = [...before, ...resolve, ...after]
      const total = runners.length
      // TODO - feat. consumer return value
      for (let index = 0; index < total; index++) {
        runners[index](node, component, util.options(node, component))
      }
      return this
    }),
    clear() {
      _internal.objs.length = 0
      return o
    },
    get(key?: string) {
      if (key === 'noodlui') return _internal.noodlui
      return _internal.objs
    },
    use(value: T.NodeResolverUseObject | T.NodeResolverUseObject[]) {
      if (Array.isArray(value)) {
        value.forEach((val) => o.use(val))
      } else if (value) {
        if (_isResolverConfig(value)) {
          o.register(value)
        } else if (value instanceof NOODLUI) {
          _internal.noodlui = value
        } else if (value instanceof NOODLUIDOMInternal) {
          _internal.noodluidom = value
        } else if (typeof value === 'object') {
          //
        }
      }
      return o
    },
  }

  return o
}

export default createResolver
