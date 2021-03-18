import { ComponentObject, StyleObject } from 'noodl-types'
import Component from '../components/Base'
import List from '../components/List'
import ListItem from '../components/ListItem'
import Page from '../components/Page'
import { NOODLComponent, ProxiedComponent } from './types'
import { PlainObject } from '.'

export type ComponentInstance = Component | List | ListItem | Page

export type ComponentConstructor = new (
  component: ComponentCreationType,
) => ComponentInstance

export type ComponentCreationType =
  | string
  | ComponentObject
  | NOODLComponent
  | ComponentInstance

export interface IComponent<
  C extends ComponentObject = ComponentObject,
  Type extends C['type'] = C['type']
> {
  id: string
  type: string
  noodlType: Type
  style: StyleObject
  length: number
  original: C
  status: 'drafting' | 'idle' | 'idle/resolved'
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
  keys: string[]
  on(eventName: string, cb: Function): this
  off(eventName: string, cb: Function): this
  parent(): ComponentInstance | null
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
