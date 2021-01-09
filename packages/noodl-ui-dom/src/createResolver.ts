import { ComponentInstance, ComponentType, NOODL as NOODLUI } from 'noodl-ui'
import NOODLUIDOMInternal from './Internal'
import * as T from './types'

type UseObject = T.NodeResolverConfig | NOODLUI | NOODLUIDOMInternal

const createResolver = function createResolver() {
  const _internal: {
    objs: T.NodeResolverConfig[]
    noodlui: NOODLUI
    noodluidom: any
  } = {
    objs: [],
    // @ts-ignore
    noodlui: undefined,
    noodluidom: undefined,
  }

  const util = {
    options(...args: T.NodeResolverBaseArgs) {
      return {
        original: args[1].original,
        noodlui: _internal.noodlui,
        draw: _internal.noodluidom.draw.bind(_internal.noodluidom),
        redraw: _internal.noodluidom.redraw.bind(_internal.noodluidom),
      } as T.NodeResolverUtils
    },
  }

  function _isResolverConfig(value: any): value is T.NodeResolverConfig {
    return (
      !!value &&
      typeof value === 'object' &&
      typeof value.resolve === 'function'
    )
  }

  function _isComponentEvent(
    type: ComponentType,
    component: ComponentInstance,
  ) {
    return type === component?.noodlType || type === component?.type
  }

  function _getRunners(...args: T.NodeResolverBaseArgs) {
    const attach = (
      lifeCycleEvent: T.NodeResolverLifeCycleEvent,
      acc: T.NodeResolverLifecycle,
      obj: T.NodeResolverConfig,
    ) => {
      if (typeof obj.cond === 'string') {
        // If they passed in a resolver strictly for this node/component
        if (_isComponentEvent(obj.cond, args[1])) {
          acc[lifeCycleEvent]?.push(obj[lifeCycleEvent] as T.NodeResolver)
        }
      } else if (typeof obj.cond === 'function') {
        // If they only want this resolver depending on a certain condition
        if (obj.cond(...args, util.options(...args))) {
          acc[lifeCycleEvent]?.push(obj[lifeCycleEvent] as T.NodeResolver)
        }
      }
    }
    return _internal.objs.reduce(
      (acc, obj) => {
        if (obj.before) attach('before', acc, obj)
        if (obj.resolve) attach('resolve', acc, obj)
        if (obj.after) attach('after', acc, obj)
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
    run: (...args: T.NodeResolverBaseArgs) => {
      const { before, resolve, after } = _getRunners(...args)
      const runners = [...before, ...resolve, ...after]
      const total = runners.length
      // TODO - feat. consumer return value
      for (let index = 0; index < total; index++) {
        runners[index](...args, util.options(...args))
      }
      return this
    },
    clear() {
      _internal.objs.length = 0
      return o
    },
    get(key?: string) {
      if (key === 'noodlui') return _internal.noodlui
      return _internal.objs
    },
    use(value: UseObject | UseObject[]) {
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
