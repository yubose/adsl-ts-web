import { ComponentObject, ComponentType, StyleObject } from 'noodl-types'
import Component from '../components/Base'
import { event } from '../constants'
import { ProxiedComponent } from './types'
import { PlainObject } from '.'

export namespace Component {
  export type HookEvent = keyof Hook | 'path'

  export interface Hook {
    [event.component.list.ADD_DATA_OBJECT](args: {
      dataObject: any
      index: number
    }): void
    [event.component.list.DELETE_DATA_OBJECT](args: {
      component: ComponentInstance
      dataObject: any
      index: number
    }): void
    [event.component.list.UPDATE_DATA_OBJECT](args: {
      dataObject: any
      index: number
    }): void
    [event.component.register.ONEVENT](): any
    content(pluginContent: string): void
    dataValue(dataValue: any): void
    path(src: string): void
    placeholder(src: string): void
  }

  export type Instance = Component
}

export type ComponentInstance = Component

export type ComponentConstructor = new (
  component: ComponentCreationType,
) => ComponentInstance

export type ComponentCreationType = string | ComponentObject | ComponentInstance

export interface IComponent<
  C extends ComponentObject = ComponentObject,
  Type extends keyof C = ComponentType
> {
  id: string
  type: Type
  style: StyleObject
  length: number
  blueprint: ComponentObject
  original: ComponentObject
  assign(key: keyof C | PlainObject, value?: PlainObject): this
  assignStyles(styles: StyleObject): this
  child(index?: number): ComponentInstance | undefined
  children: ComponentInstance[]
  createChild<Child extends ComponentInstance = any>(child: Child): Child
  hasChild(id: string): boolean
  hasChild(child: ComponentInstance): boolean
  removeChild(child: ComponentInstance): ComponentInstance | undefined
  removeChild(id: string): ComponentInstance | undefined
  removeChild(index: number): ComponentInstance | undefined
  removeChild(): ComponentInstance | undefined
  get<K extends keyof C>(key: K, styleKey?: keyof StyleObject): C[K]
  get<K extends keyof C>(
    key: K[],
    styleKey?: keyof StyleObject,
  ): Record<K, C[K]>
  get(key: keyof C, styleKey?: keyof StyleObject): any
  getStyle<K extends keyof StyleObject>(styleKey: K): StyleObject[K]
  has(key: keyof C, styleKey?: keyof StyleObject): boolean
  on(eventName: string, cb: Function): this
  off(eventName: string, cb: Function): this
  parent: ComponentInstance | null
  props(): { id: string } & ComponentObject
  remove(key: keyof C, styleKey?: keyof StyleObject): this
  removeStyle<K extends keyof StyleObject>(styleKey: K): this
  set<K extends keyof C>(key: K, value?: any, styleChanges?: any): this
  set<O extends C>(key: O, value?: any, styleChanges?: any): this
  setParent(parent: ComponentInstance): this
  setStyle<K extends keyof StyleObject>(styleKey: K, value: any): this
  snapshot(): ReturnType<IComponent['toJSON']> & {
    _cache: any
  }
  toJSON(): Omit<ReturnType<IComponent['props']>, 'children'> & {
    children: ReturnType<IComponent['toJSON']>[]
    parentId: string | null
  }
  toJS(): any
}

export type ListBlueprint = ProxiedComponent & {
  listId: string
  iteratorVar: string
}

export interface ListDataObjectOperationResult<DataObject = any> {
  index: null | number
  dataObject: DataObject | null
  success: boolean
  error?: string
}

export interface ListDataObjectEventHandlerOptions {
  blueprint: ListBlueprint
  listId: string
  iteratorVar: string
}

export type PluginComponentType =
  | 'plugin'
  | 'pluginHead'
  | 'pluginBodyTop'
  | 'pluginBodyTail'
