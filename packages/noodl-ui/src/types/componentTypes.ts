import { ComponentObject, ComponentType, StyleObject } from 'noodl-types'
import Component from '../components/Base'

export interface IComponent<C extends ComponentObject = ComponentObject> {
  id: string
  type: ComponentType
  style: StyleObject
  length: number
  blueprint: C
  props(): { id: string } & ComponentObject
  child(index?: number): ComponentInstance | undefined
  children: ComponentInstance[]
  createChild<Child extends ComponentInstance = any>(child: Child): Child
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
  has(key: keyof C, styleKey?: keyof StyleObject): boolean
  on(eventName: string, cb: (...args: any[]) => any): this
  off(eventName: string, cb: (...args: any[]) => any): this
  parent: ComponentInstance | null
  remove(key: keyof C, styleKey?: keyof StyleObject): this
  setParent(parent: ComponentInstance): this
  snapshot(): ReturnType<IComponent['toJSON']> & {
    _cache: any
  }
  toJSON(): Omit<ReturnType<IComponent['props']>, 'children'> & {
    children: ReturnType<IComponent['toJSON']>[]
    parentId: string | null
  }
}

export type ComponentInstance = Component<ComponentObject>
export type ComponentCreationType = ComponentObject | ComponentInstance
export type PluginComponentType =
  | 'plugin'
  | 'pluginHead'
  | 'pluginBodyTop'
  | 'pluginBodyTail'
