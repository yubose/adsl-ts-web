import { isComponent, NOODL as NOODLUI } from 'noodl-ui'
import { componentEventIds } from './constants'
import * as T from './types'

const createResolver = function createResolver() {
  let objs: T.NodeResolverConfig[] = []
  let noodlui: NOODLUI

  const util = {
    options: (...args: T.NodeResolverBaseArgs) =>
      ({
        original: args[1].original,
      } as ReturnType<T.NodeResolverUtil['options']>),
  }

  // const middlewares = [] as any[]

  // const _middlewareResolver = (...args: T.NodeResolverBaseArgs) => {
  //   return () => middlewares.forEach((fn) => fn(...args))
  // }

  function _resolve(
    obj: T.NodeResolverConfig,
    ...args: T.NodeResolverBaseArgs
  ) {
    return obj.resolve(...args, util.options(...args))
  }

  function _run(
    runner: <N extends T.NOODLDOMElement = any>(
      configs: T.NodeResolverConfig[],
      node: T.NodeResolverBaseArgs<N, any>[0],
      component: T.NodeResolverBaseArgs<N, any>[1],
    ) => void,
  ) {
    return (...args: T.NodeResolverBaseArgs) => {
      return runner(objs, ...args)
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
    ...args: T.NodeResolverBaseArgs
  ) {
    return isComponent(args[1] && componentEventIds.includes(type))
  }

  function _getRunners(
    configs: T.NodeResolverConfig[],
    ...args: T.NodeResolverBaseArgs
  ) {
    return configs.reduce((acc, obj) => {
      if (typeof obj.cond === 'string') {
        // If they passed in a resolver strictly for this node/component
        return _isComponentEvent(obj.cond, ...args) ? acc.concat(obj) : acc
      } else if (typeof obj.cond === 'function') {
        // If they only want this resolver depending on a certain condition
        return obj.cond(...args, util.options(...args)) ? acc.concat(obj) : acc
      }
      return acc.concat(obj)
    }, [] as T.NodeResolverConfig[])
  }

  const o = {
    register(obj: T.NodeResolverConfig) {
      if (!objs.includes(obj)) objs.push(obj)
      return o
    },
    run: _run((configs, node, component) => {
      const runners = _getRunners(configs, node, component)
      const total = runners.length
      // TODO - feat. consumer return value
      for (let index = 0; index < total; index++) {
        _resolve(runners[index], node, component)
      }
      return this
    }),
    clear() {
      objs.length = 0
      return o
    },
    get(key?: string) {
      if (key === 'noodlui') return noodlui
      return objs
    },
    use(value: T.NodeResolverUseObject | T.NodeResolverUseObject[]) {
      if (Array.isArray(value)) {
        value.forEach((val) => o.use(val))
      } else {
        if (_isResolverConfig(value)) {
          o.register(value)
        } else if (value instanceof NOODLUI) {
          noodlui = value
        }
      }
      return o
    },
  }

  return o
}

export default createResolver
