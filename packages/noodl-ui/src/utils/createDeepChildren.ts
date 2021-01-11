import { ComponentObject } from 'noodl-types'
import {
  ComponentCreationType,
  ComponentInstance,
  NOODLComponent,
} from '../types'
import createComponent from './createComponent'
import { unwrapObj } from './noodl'

/**
 * Deeply creates children until the depth is reached
 * @param { ComponentCreationType | ComponentInstance } c - ComponentInstance instance
 * @param { object } opts
 * @param { number | undefined } opts.depth - The maximum depth to deeply recurse to. Defaults to 1
 * @param { object | undefined } opts.injectProps - Props to inject to desired components during the recursion
 * @param { object | undefined } opts.injectProps.last - Props to inject into the last created child
 */
function createDeepChildren(
  c: ComponentCreationType | ComponentInstance,
  opts?: {
    depth?: number
    injectProps?: {
      last?:
        | { [key: string]: any }
        | ((rootProps: Partial<ComponentObject>) => Partial<ComponentObject>)
    }
    onCreate?(child: ComponentInstance, depth: number): Partial<NOODLComponent>
  },
): ComponentInstance {
  if (opts?.depth) {
    let count = 0
    let curr =
      typeof c === 'string'
        ? (c = createComponent({ type: c, children: [] } as any))
        : c
    while (count < opts.depth) {
      const cc = createComponent({ type: 'view', children: [] })
      const child = curr.createChild(cc)
      let injectingProps = opts?.onCreate?.(child, count)
      if (typeof injectingProps === 'object') {
        Object.entries(injectingProps).forEach(([k, v]) => child.set(k, v))
      }
      curr = child
      count++
      if (count === opts.depth) {
        if (opts.injectProps?.last) {
          Object.entries(unwrapObj(opts.injectProps?.last)).forEach(
            ([k, v]) => {
              if (k === 'style') curr.set('style', k, v)
              else curr.set(k, v)
            },
          )
        }
      }
    }
  }
  return c as ComponentInstance
}

export default createDeepChildren
