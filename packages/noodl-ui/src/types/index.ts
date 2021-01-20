export * from './actionTypes'
export * from './actionChainTypes'
export * from './componentTypes'
export * from './constantTypes'
export * from './storeTypes'
export * from './types'

export interface AnyFn {
  (...args: any[]): any
}

export interface PlainObject {
  [key: string]: any
}
