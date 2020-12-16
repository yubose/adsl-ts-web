import { Component } from 'noodl-ui'
import { NodeResolverConfig } from './types'

export interface NodeResolverUtil {
  getOptions(): { original: Component['original'] }
}

const handlers = (function () {
  let objs: NodeResolverConfig[] = []

  const _getOptions = (node, component) => () =>
    ({
      original: component.original,
    } as ReturnType<NodeResolverUtil['getOptions']>)

  const o = {
    register(obj: NodeResolverConfig) {
      if (!objs.includes(obj)) objs = objs.concat(obj)
      return o
    },
    run(
      node: HTMLElement | null,
      component: Component,
      util: NodeResolverUtil,
    ) {
      const total = objs.length
      for (let index = 0; index < total; index++) {
        const obj = objs[index]
        if (typeof obj.cond === 'function') {
          if (obj.cond(node, component, util.getOptions())) {
            obj.resolve(node, component, util.getOptions())
          } else continue
        }
        obj.resolve(node, component, util.getOptions())
      }
      return o
    },
  }

  return o
})()

export default handlers
