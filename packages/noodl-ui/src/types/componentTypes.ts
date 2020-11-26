import {
  NOODLComponent,
  ProxiedComponent,
  ResolverFn,
  SelectOption,
  Style,
} from './types'
import { IListEventId, NOODLComponentType } from './constantTypes'
import { ActionObject } from './actionTypes'

export type IComponentConstructor = new (
  component: IComponentType,
) => IComponentTypeInstance

export interface IComponent<K = NOODLComponentType> {
  id: string
  type: K
  noodlType: NOODLComponentType
  style: Style
  action: ActionObject
  length: number
  original: NOODLComponent | NOODLComponentProps | ProxiedComponent
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
  broadcast(cb: (child: IComponentTypeInstance) => void): this
  child(index?: number): IComponentTypeInstance | undefined
  children(): IComponentTypeInstance[]
  createChild<C extends IComponentTypeInstance>(child: C): C
  hasChild(childId: string): boolean
  hasChild(child: IComponentTypeInstance): boolean
  removeChild(index: number): IComponentTypeInstance | undefined
  removeChild(id: string): IComponentTypeInstance | undefined
  removeChild(child: IComponentTypeInstance): IComponent | undefined
  removeChild(): IComponentTypeInstance | undefined
  done(options?: { mergeUntouched?: boolean }): this
  draft(): this
  get<K extends keyof IComponentTypeObject>(
    key: K | K[],
    styleKey?: keyof Style,
  ): IComponentTypeObject[K] | Record<K, IComponentTypeObject[K]>
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
  parent(): IComponentTypeInstance | null
  remove(key: string, styleKey?: keyof Style): this
  removeStyle<K extends keyof Style>(styleKey: K): this
  set<K extends keyof IComponentTypeObject>(
    key: K,
    value?: any,
    styleChanges?: any,
  ): this
  set<O extends IComponentTypeObject>(
    key: O,
    value?: any,
    styleChanges?: any,
  ): this
  setParent(parent: IComponentTypeInstance): this
  setStyle<K extends keyof Style>(styleKey: K, value: any): this
  snapshot(): (ProxiedComponent | NOODLComponentProps) & {
    _touched: string[]
    _untouched: string[]
    _touchedStyles: string[]
    _untouchedStyles: string[]
    _handled: string[]
    _unhandled: string[]
    noodlType: NOODLComponentType | undefined
  }
  toJS(): ProxiedComponent
  toString(): string
  touch(key: string): this
  touchStyle(styleKey: string): this
}

export type IComponentType =
  | IComponentTypeInstance
  | IComponentTypeObject
  | NOODLComponentType

export type IComponentTypeInstance = IComponent

export type IComponentTypeObject =
  | NOODLComponent
  | NOODLComponentProps
  | ProxiedComponent

export interface IList<
  ListData extends any[] = any[],
  DataObject extends ListData[number] = ListData[number]
> extends IComponent {
  noodlType: 'list'
  children(): IListItem[]
  exists(childId: string): boolean
  exists(child: IListItem): boolean
  find(child: string | number | IListItem): IListItem | undefined
  getBlueprint(): IListBlueprint
  setBlueprint(blueprint: IListBlueprint): this
  getData(opts?: { fromNodes?: boolean }): ListData
  hasCb(eventName: IListEventId, fn: Function): boolean
  addDataObject(
    dataObject: DataObject,
  ): IListDataObjectOperationResult<DataObject>
  getDataObject(
    index: number | Function,
  ): IListDataObjectOperationResult<DataObject>
  removeDataObject(
    dataObject:
      | number
      | DataObject
      | ((dataObject: DataObject | null) => boolean),
  ): IListDataObjectOperationResult<DataObject>
  updateDataObject<DataObject = any>(
    index: number | Function,
    dataObject: DataObject | null,
  ): IListDataObjectOperationResult<DataObject>
  iteratorVar: string
  listId: string
  length: number
  find(id: string): IListItem | undefined
  find(index: number): IListItem | undefined
  find(inst: IListItem): IListItem | undefined
  find(
    pred: (listItem: IListItem, index: number) => boolean,
  ): IListItem | undefined
  emit(eventName: 'blueprint', blueprint: IListBlueprint): this
  emit(eventName: 'redraw'): this
  emit<E extends Exclude<IListEventId, 'blueprint' | 'redraw'>>(
    eventName: E,
    result: IListDataObjectOperationResult,
    args: IListDataObjectEventHandlerOptions,
  ): this
  on(eventName: 'blueprint', cb: (blueprint: IListBlueprint) => void): this
  on(eventName: 'redraw', cb: () => void): this
  on(
    eventName:
      | 'add.data.object'
      | 'delete.data.object'
      | 'remove.data.object'
      | 'retrieve.data.object',
    cb: (
      result: IListDataObjectOperationResult,
      args: IListDataObjectEventHandlerOptions,
    ) => void,
  ): this
  toJS(): {
    blueprint: IListBlueprint
    children: ReturnType<IListItem['toJS']>[]
    listId: string
    listItemCount: number
    listObject: ListData
    iteratorVar: string
    style: Style | undefined
  }
}

export type IListBlueprint = Partial<ProxiedComponent> & {
  listId: string
  iteratorVar: string
}

export interface IListDataObjectOperationResult<DataObject = any> {
  index: null | number
  dataObject: DataObject | null
  success: boolean
  error?: string
}

export interface IListDataObjectEventHandlerOptions {
  blueprint: IListBlueprint
  listId: string
  iteratorVar: string
  nodes: IListItem[]
}

export interface IListItem<DataObject = any> extends IComponent {
  noodlType: 'listItem'
  listId: string
  listIndex: number | null
  iteratorVar: string
  getDataObject(): DataObject | undefined
  setDataObject(data: DataObject): this
  redraw(): this
  toJS(): {
    children: ReturnType<IComponentTypeInstance['toJS']>[]
    dataObject: DataObject
    listId: string
    listIndex: number | null
    iteratorVar: string
    style: Style | undefined
  }
  // on(eventName: 'redraw', (args: IListItemRedrawArgs) => void): this
  // on(eventName: 'redrawed', (args: IListItemRedrawedArgs) => void): this
  emit(eventName: 'redraw', args: IListItemRedrawArgs): this
  emit(eventName: 'redrawed', args: IListItemRedrawedArgs): this
}

export interface IListItemRedrawArgs {
  props: Partial<IComponentTypeObject>
}

export interface IListItemRedrawedArgs {
  props: IListItemRedrawArgs['props']
  listItem: IListItem
}

export interface ITextboard extends IComponent {}

export interface IResolver {
  internal: boolean
  setResolver(resolver: ResolverFn): this
  resolve: ResolverFn
}

export type NOODLComponentCreationType = string | number | IComponentType

export type NOODLComponentProps = Omit<
  NOODLComponent,
  'children' | 'options' | 'type'
> & {
  'data-key'?: string
  'data-listdata'?: any[]
  'data-listid'?: any
  'data-name'?: string
  'data-value'?: string
  'data-ux'?: string
  custom?: boolean
  children?: string | number | NOODLComponentProps | NOODLComponentProps[]
  noodlType: NOODLComponentType
  id: string
  items?: any[]
  options?: SelectOption[]
  type: keyof Omit<HTMLElementTagNameMap, 'object'>
  [key: string]: any
}
