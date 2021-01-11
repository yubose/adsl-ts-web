import { ComponentObject, StyleObject } from 'noodl-types'
import Component from '../components/Base'
import List from '../components/List'
import ListItem from '../components/ListItem'
import Page from '../components/Page'
import { ProxiedComponent } from './types'
import { PlainObject } from '.'

export type ComponentInstance = Component | List | ListItem | Page

export type ComponentConstructor = new (
  component: ComponentCreationType,
) => ComponentInstance

export type ComponentCreationType = string | ComponentObject | ComponentInstance

export interface IComponent<C extends ComponentObject, Type extends C['type']> {
  id: string
  type: string
  noodlType: Type
  style: StyleObject
  length: number
  original: C
  status: 'drafting' | 'idle' | 'idle/resolved'
  stylesTouched: keyof StyleObject[]
  stylesUntouched: keyof StyleObject[]
  touched: keyof C[]
  untouched: keyof C[]
  assign(key: keyof C | PlainObject, value?: PlainObject): this
  assignStyles(styles: StyleObject): this
  child(index?: number): ComponentInstance | undefined
  children(): ComponentInstance[]
  createChild<Child extends ComponentInstance = any>(child: Child): Child
  hasChild(id: string): boolean
  hasChild(child: ComponentInstance): boolean
  removeChild(child: ComponentInstance): ComponentInstance | undefined
  removeChild(id: string): ComponentInstance | undefined
  removeChild(index: number): ComponentInstance | undefined
  removeChild(): ComponentInstance | undefined
  done(options?: { mergeUntouched?: boolean }): this
  draft(): this
  get<K extends keyof C>(key: K, styleKey?: keyof StyleObject): C[K]
  get<K extends keyof C>(
    key: K[],
    styleKey?: keyof StyleObject,
  ): Record<K, C[K]>
  get(key: keyof C, styleKey?: keyof StyleObject): any
  getStyle<K extends keyof StyleObject>(styleKey: K): StyleObject[K]
  has(key: keyof C, styleKey?: keyof StyleObject): boolean
  hasParent(): boolean
  hasStyle<K extends keyof StyleObject>(styleKey: K): boolean
  isHandled(key: keyof C): boolean
  isTouched(key: keyof C): boolean
  isStyleTouched(styleKey: keyof StyleObject): boolean
  isStyleHandled(key: keyof StyleObject): boolean
  keys: keyof C[]
  merge(key: keyof C | PlainObject, value?: any): this
  on(eventName: string, cb: Function): this
  off(eventName: string, cb: Function): this
  parent(): ComponentInstance | null
  remove(key: keyof C, styleKey?: keyof StyleObject): this
  removeStyle<K extends keyof StyleObject>(styleKey: K): this
  set<K extends keyof C>(key: K, value?: any, styleChanges?: any): this
  set<O extends C>(key: O, value?: any, styleChanges?: any): this
  setParent(parent: ComponentInstance): this
  setStyle<K extends keyof StyleObject>(styleKey: K, value: any): this
  snapshot(): ProxiedComponent & {
    _touched: keyof C[]
    _untouched: keyof C[]
    _touchedStyles: keyof StyleObject[]
    _untouchedStyles: keyof StyleObject[]
    _handled: keyof C[]
    _unhandled: keyof C[]
    noodlType: Type
  }
  touch(key: keyof C): this
  touchStyle(styleKey: keyof StyleObject): this
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
