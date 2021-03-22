import { ComponentType, RegisterComponentObject } from 'noodl-types'
import { ComponentInstance } from './componentTypes'
import { NOODLUIActionType, NOODLUITrigger } from './constantTypes'
import { ConsumerOptions, Register } from './types'

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

  export interface RegisterObject<P extends Register.Page = '_global'> {
    registerEvent: string
    component?: RegisterComponentObject | ComponentInstance
    fn?<D = any>(data?: D): D
    name?: string
    page: P
  }
}
