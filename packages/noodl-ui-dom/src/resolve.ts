import {
  NodeResolverBaseArgs,
  NodeResolverConfig,
  NOODLDOMElement,
} from './types'

export interface NodeResolverUtil {
  getOptions(): { original: any }
}

export interface NodeResolverRunner {
  (node: HTMLElement | null, component: any, util: NodeResolverUtil): void
}

const handlers = (function () {
  let objs: NodeResolverConfig[] = []

  const util = {
    getOptions: (...args: NodeResolverBaseArgs) =>
      ({
        original: args[1].original,
      } as ReturnType<NodeResolverUtil['getOptions']>),
  }

  const middlewares = [] as any[]

  const _middlewareResolver = (...args: NodeResolverBaseArgs) => {
    return () => middlewares.forEach((fn) => fn(...args))
  }

  function _resolve(obj: NodeResolverConfig, ...args: NodeResolverBaseArgs) {
    obj.resolve(...args, util.getOptions(...args))
  }

  function _run(
    runner: <N extends NOODLDOMElement = any>(
      configs: NodeResolverConfig[],
      node: NodeResolverBaseArgs<N, any>[0],
      component: NodeResolverBaseArgs<N, any>[1],
    ) => void,
  ) {
    return (...args: NodeResolverBaseArgs) => {
      return runner(objs, ...args)
    }
  }

  function _isResolverConfig(value: any): value is NodeResolverConfig {
    return (
      !!value &&
      typeof value === 'object' &&
      typeof value.resolve === 'function'
    )
  }

  const o = {
    register(obj: NodeResolverConfig) {
      if (!objs.includes(obj)) objs.push(obj)
      return o
    },
    run: _run((configs, node, component) => {
      const total = configs.length
      for (let index = 0; index < total; index++) {
        const obj = configs[index]
        if (typeof obj.cond === 'function') {
          if (obj.cond(node, component, util.getOptions(node, component))) {
            _resolve(obj, node, component)
          }
          continue
        }
        _resolve(obj, node, component)
      }
      return this
    }),
    clear() {
      objs.length = 0
      return o
    },
    get(key?: string) {
      return objs
    },
    use(value: any) {
      if (Array.isArray(value)) {
        value.forEach((val) => o.use(val))
      } else {
        if (_isResolverConfig(value)) {
          o.register(value)
        }
      }
      return o
    },
  }

  return o
})()

export default handlers
