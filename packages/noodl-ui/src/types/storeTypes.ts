import { LiteralUnion } from 'type-fest'
import { ComponentType, RegisterComponentObject } from 'noodl-types'
import { ComponentInstance } from './componentTypes'
import { NOODLUIActionType, NOODLUITrigger } from './index'
import { ConsumerOptions, RegisterPage } from './types'

export namespace Store {
  export interface ActionObject {
    actionType: NOODLUIActionType
    fn: (...args: any[]) => any
    trigger?: NOODLUITrigger
  }

  export interface BuiltInObject {
    actionType: 'builtIn'
    fn: (...args: any[]) => any
    funcName: string
  }

  export interface ObserverObject {
    name?: string
    cond?: ComponentType | ((...args: any[]) => boolean)
    observe(component: ComponentInstance, options: ConsumerOptions): void
  }

  export interface Plugins {
    head: PluginObject[]
    body: {
      top: PluginObject[]
      bottom: PluginObject[]
    }
  }

  export interface PluginObject {
    initiated?: boolean
    location?: 'head' | 'body-top' | 'body-bottom'
    path?: string
    content?: string
    ref: ComponentInstance
  }

  export interface RegisterObject<P extends RegisterPage = '_global'> {
    type: LiteralUnion<'onEvent', string> // 'onEvent'
    name: string
    component: ComponentInstance | null
    fn: RegisterObjectInput<P>['fn'] | undefined
    page: P
    callback(data: any): void
  }

  export interface RegisterObjectInput<P extends string = '_global'> {
    component?: RegisterComponentObject | ComponentInstance
    fn?<D = any>(data?: D): D
    name?: string
    page: P
  }
}
