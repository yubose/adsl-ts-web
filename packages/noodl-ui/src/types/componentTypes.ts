import Component from '../components/Base'
import { NOODLComponent, ProxiedComponent, Style } from './types'
import { ActionObject } from './actionTypes'
import { ComponentType } from './constantTypes'

export type ComponentConstructor = new (
  component: ComponentCreationType,
) => Component

export type ComponentCreationType = string | ComponentObject | Component

export type ComponentObject = NOODLComponent & ProxiedComponent

export interface IComponent<K = ComponentType> {
  id: string
  type: K
  noodlType: K
  style: Style
  action: ActionObject
  length: number
  original: ComponentObject
  status: 'drafting' | 'idle' | 'idle/resolved'
  stylesTouched: string[]
  stylesUntouched: string[]
  touched: string[]
  untouched: string[]
  assign(
    key: string | { [key: string]: any },
    value?: { [key: string]: any },
  ): this
  assignStyles(styles: Partial<Style>): this
  broadcast(cb: (child: Component) => void): this
  child(index?: number): Component | undefined
  children(): Component[]
  createChild<C extends Component>(child: C): C
  hasChild(childId: string): boolean
  hasChild(child: Component): boolean
  removeChild(child: Component): Component | undefined
  removeChild(id: string): Component | undefined
  removeChild(index: number): Component | undefined
  removeChild(): Component | undefined
  done(options?: { mergeUntouched?: boolean }): this
  draft(): this
  get<K extends keyof ComponentObject>(
    key: K | K[],
    styleKey?: keyof Style,
  ): ComponentObject[K] | Record<K, ComponentObject[K]>
  getStyle<K extends keyof Style>(styleKey: K): Style[K]
  has(key: string, styleKey?: keyof Style): boolean
  hasParent(): boolean
  hasStyle<K extends keyof Style>(styleKey: K): boolean
  isHandled(key: string): boolean
  isTouched(key: string): boolean
  isStyleTouched(styleKey: string): boolean
  isStyleHandled(key: string): boolean
  keys: string[]
  merge(key: string | { [key: string]: any }, value?: any): this
  on(eventName: string, cb: Function): this
  off(eventName: string, cb: Function): this
  parent(): Component | null
  remove(key: string, styleKey?: keyof Style): this
  removeStyle<K extends keyof Style>(styleKey: K): this
  set<K extends keyof ComponentObject>(
    key: K,
    value?: any,
    styleChanges?: any,
  ): this
  set<O extends ComponentObject>(key: O, value?: any, styleChanges?: any): this
  setParent(parent: Component): this
  setStyle<K extends keyof Style>(styleKey: K, value: any): this
  snapshot(): ProxiedComponent & {
    _touched: string[]
    _untouched: string[]
    _touchedStyles: string[]
    _untouchedStyles: string[]
    _handled: string[]
    _unhandled: string[]
    noodlType: ComponentType | undefined
  }
  touch(key: string): this
  touchStyle(styleKey: string): this
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
