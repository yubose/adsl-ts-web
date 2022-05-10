import * as _is_ from './utils/is'
import coreBuiltInFns from './builtIn/core'
import objectBuiltInFns from './builtIn/object'

export { default as Builder } from './Builder'
export { default as Diagnostics } from './Diagnostics'
export { default as deref } from './deref'
export { default as transform } from './transform'
export { toPath } from './utils/fp'
export * from './utils/noodl'
export * as regex from './utils/regex'
export * as consts from './constants'
export * from './types'

export const is = {
  awaitReference: _is_.awaitReference,
  evalLocalReference: _is_.evalLocalReference,
  evalReference: _is_.evalReference,
  evalRootReference: _is_.evalRootReference,
  localKey: _is_.localKey,
  localReference: _is_.localReference,
  reference: _is_.reference,
  rootKey: _is_.rootKey,
  rootReference: _is_.rootReference,
  tildeReference: _is_.tildeReference,
  traverseReference: _is_.traverseReference,
} as const

export function getBuiltIns() {
  const fns = {
    core: coreBuiltInFns,
    object: objectBuiltInFns,
  } as const

  // return Object.entries(fns).reduce((acc, [name, fn]) => {
  //   acc[`=.builtIn.${name}`] = fn
  //   return acc
  // }, {} as Record<`=.builtIn.${keyof typeof fns}.${string}`, typeof fns[keyof typeof fns]>)
  return fns
}
