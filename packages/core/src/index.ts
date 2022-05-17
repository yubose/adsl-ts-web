import coreBuiltInFns from './builtIn/core'
import objectBuiltInFns from './builtIn/object'

export { default as Builder } from './Builder'
export { default as createCompiler } from './compiler/createCompiler'
export { default as Diagnostics } from './diagnostics/Diagnostics'
export { default as deref } from './deref'
export { default as FileSystem } from './FileSystem'
export { default as transform } from './transform'
export { generateDiagnosticMessage } from './diagnostics/utils'
export { toPath } from './utils/fp'
export * as fp from './utils/fp'
export * as is from './utils/is'
export * from './utils/noodl'
export * as regex from './utils/regex'
export * as consts from './constants'
export * from './types'

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
