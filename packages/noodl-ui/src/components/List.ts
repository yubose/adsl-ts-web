import isPlainObject from 'lodash/isPlainObject'
import find from 'lodash/find'
import isNil from 'lodash/isNil'
import { ComponentObject } from 'noodl-types'
import {
  ComponentConstructor,
  IComponent,
  ListBlueprint,
  ListEventId,
  ListDataObjectEventHandlerOptions,
  ListDataObjectOperationResult,
  ProxiedComponent,
} from '../types'
import Component from './Base'
import ListItem from './ListItem'
import { forEachEntries, getRandomKey } from '../utils/common'
import { event } from '../constants'

class List extends Component implements IComponent {
  #blueprint: ListBlueprint
  #children: ListItem[] = []
  #listId: string
  #listObject: any[]
  #iteratorVar: string
  #cb: {
    [event.component.list.ADD_DATA_OBJECT]: Function[]
    [event.component.list.DELETE_DATA_OBJECT]: Function[]
    [event.component.list.RETRIEVE_DATA_OBJECT]: Function[]
    [event.component.list.UPDATE_DATA_OBJECT]: Function[]
    [event.component.list.CREATE_LIST_ITEM]: Function[]
    [event.component.list.REMOVE_LIST_ITEM]: Function[]
    [event.component.list.RETRIEVE_LIST_ITEM]: Function[]
    [event.component.list.UPDATE_LIST_ITEM]: Function[]
  } = {
    [event.component.list.ADD_DATA_OBJECT]: [],
    [event.component.list.DELETE_DATA_OBJECT]: [],
    [event.component.list.RETRIEVE_DATA_OBJECT]: [],
    [event.component.list.UPDATE_DATA_OBJECT]: [],
    [event.component.list.CREATE_LIST_ITEM]: [],
    [event.component.list.REMOVE_LIST_ITEM]: [],
    [event.component.list.RETRIEVE_LIST_ITEM]: [],
    [event.component.list.UPDATE_LIST_ITEM]: [],
  }

  constructor(...args: ConstructorParameters<ComponentConstructor>)
  constructor()
  constructor(...args: any | ConstructorParameters<ComponentConstructor>) {
    super(
      ...((args.length
        ? args
        : [{ type: 'list' }]) as ConstructorParameters<ComponentConstructor>),
    )
    // These initial values will be set once in the prototype.
    // When we use .set, we will intercept the call and set them
    // on this instance instead
    this.set('listId', getRandomKey())
    this.set('listObject', super.get('listObject') || [])
    this.set('iteratorVar', super.get('iteratorVar') || '')
    this.#children = []
  }

  get iteratorVar() {
    return this.#iteratorVar || ''
  }

  get listId() {
    return this.#listId || ''
  }

  get length() {
    return this.#children.length
  }

  get type() {
    return 'list' as const
  }

  get children() {
    return this.#children as any
  }

  getData({ fromNodes = false }: { fromNodes?: boolean } = {}): any[] {
    return (
      (fromNodes
        ? this.#children.map((c) => c.getDataObject?.())
        : this.#listObject) || []
    )
  }

  addDataObject<DataObject = any>(
    dataObject: DataObject,
  ): ListDataObjectOperationResult<DataObject> {
    if (!Array.isArray(this.#listObject)) this.#listObject = []
    this.#listObject.push(dataObject)
    const result = {
      index: this.#listObject.length - 1,
      dataObject,
      success: true,
    } as ListDataObjectOperationResult<DataObject>
    this.emit(
      event.component.list.ADD_DATA_OBJECT,
      result,
      this.#getDataObjectHandlerOptions(),
    )
    return result
  }

  getDataObject<DataObject>(
    query: <D extends DataObject>(dataObject: D) => boolean,
  ): DataObject | undefined
  getDataObject<DataObject>(index: number): DataObject | undefined
  getDataObject<DataObject>(
    index: number | ((dataObject: DataObject) => boolean),
  ): ListDataObjectOperationResult {
    let result = {} as ListDataObjectOperationResult

    if (Array.isArray(this.#listObject)) {
      // By index
      if (typeof index === 'number') {
        const dataObject = Array.isArray(this.#listObject)
          ? this.#listObject[index]
          : null

        result['index'] = index
        result['dataObject'] = dataObject

        if (dataObject === null) {
          result['error'] = `Could not retrieve a dataObject at index ${index}`
        } else {
          result['success'] = false
        }
        this.emit(
          event.component.list.RETRIEVE_DATA_OBJECT,
          result,
          this.#getDataObjectHandlerOptions(),
        )
        return result
      }
      // By query
      if (typeof index === 'function') {
        const query = index
        if (Array.isArray(this.#listObject)) {
          for (let index = 0; index < this.#listObject.length; index++) {
            const dataObject = this.#listObject[index]
            if (query(dataObject)) {
              this.emit(
                event.component.list.RETRIEVE_DATA_OBJECT,
                (result = { index, dataObject, success: true }),
                this.#getDataObjectHandlerOptions(),
              )
              return result
            }
          }
        } else {
          return {
            index,
            dataObject: null,
            success: false,
            error: 'listObject is empty',
          } as any
        }
      }
    } else {
      return {
        index,
        dataObject: null,
        success: false,
        error: 'listObject is empty',
      } as any
    }

    return { index, dataObject: null, success: false } as any
  }

  removeDataObject<DataObject>(
    pred: (dataObject: DataObject | null) => boolean,
  ): ListDataObjectOperationResult<DataObject>
  removeDataObject<DataObject>(
    dataObject: DataObject,
  ): ListDataObjectOperationResult<DataObject>
  removeDataObject<DataObject>(
    index: number,
  ): ListDataObjectOperationResult<DataObject>
  removeDataObject<DataObject = any>(
    dataObject: DataObject | number | ((pred: DataObject | null) => boolean),
  ) {
    if (!Array.isArray(this.#listObject)) {
      return {
        index: typeof dataObject === 'number' ? dataObject : null,
        dataObject: typeof dataObject === 'object' ? dataObject : null,
        success: false,
        error: 'listObject was empty',
      }
    }
    if (!isNil(dataObject)) {
      let index
      let removedDataObject: any
      // By query func
      if (typeof dataObject === 'function') {
        const fn = dataObject
        index = this.#listObject.findIndex(fn)
        removedDataObject = this.#listObject.splice(index, 1)[0]
        const result = {
          index,
          dataObject: removedDataObject,
          success: !!removedDataObject,
        }
        this.emit(
          event.component.list.DELETE_DATA_OBJECT,
          result,
          this.#getDataObjectHandlerOptions(),
        )
        return result
      }
      // By direct reference
      else if (typeof dataObject === 'object') {
        index = this.#listObject.findIndex((obj) => obj === dataObject)
        if (index !== -1)
          removedDataObject = this.#listObject.splice(index, 1)[0]
        const result = {
          index: index === -1 ? null : index,
          dataObject,
          success: !!removedDataObject,
        }
        if (!result.success) result['error'] = 'Could not find the dataObject'
        this.emit(
          event.component.list.DELETE_DATA_OBJECT,
          result,
          this.#getDataObjectHandlerOptions(),
        )
      }
      // By index
      else if (typeof dataObject === 'number') {
        index = dataObject
        removedDataObject = this.#listObject.splice(index, 1)[0]
        const result = {
          index,
          dataObject: removedDataObject,
          success: !!removedDataObject,
        }
        if (!result.success) result['error'] = 'Could not find the dataObject'
        this.emit(
          event.component.list.DELETE_DATA_OBJECT,
          result,
          this.#getDataObjectHandlerOptions(),
        )
        return result
      }
    }
    return {
      index: typeof dataObject === 'number' ? dataObject : null,
      dataObject: typeof dataObject === 'object' ? dataObject : null,
      success: false,
      error: 'listObject was empty',
    } as ListDataObjectOperationResult<DataObject>
  }

  updateDataObject<DataObject = any>(
    index: number,
    dataObject: DataObject | null,
  ): ListDataObjectOperationResult<DataObject>
  updateDataObject<DataObject = any>(
    pred: (dataObject: DataObject | null) => boolean,
    dataObject: DataObject | null,
  ): ListDataObjectOperationResult<DataObject>
  updateDataObject<DataObject = any>(
    index: number | ((dataObject: DataObject | null) => boolean),
    dataObject: DataObject | null,
  ) {
    // By index
    if (typeof index === 'number') {
      const prevDataObject = this.#listObject[index]
      this.#listObject[index] = isPlainObject(prevDataObject)
        ? { ...prevDataObject, ...dataObject }
        : Array.isArray(prevDataObject)
        ? prevDataObject.concat(dataObject)
        : prevDataObject
      const result = {
        index,
        dataObject: this.#listObject[index],
        success: true,
      }
      this.emit(
        event.component.list.UPDATE_DATA_OBJECT,
        result,
        this.#getDataObjectHandlerOptions(),
      )
      return result
    }
    // By function query
    if (typeof index === 'function') {
      const pred = index
      if (Array.isArray(this.#listObject)) {
        const numItems = this.#listObject.length
        for (let i = 0; i < numItems; i++) {
          const dataObject = this.#listObject[i]
          if (pred(dataObject)) {
            this.#listObject[i] = dataObject
            const result = {
              index: i,
              dataObject: this.#listObject[i],
              success: true,
            }
            this.emit(
              event.component.list.UPDATE_DATA_OBJECT,
              result,
              this.#getDataObjectHandlerOptions(),
            )
            return result
          }
        }
      } else {
        if (pred(null)) {
          this.#listObject = [dataObject]
          const result = { index: 0, dataObject, success: true }
          this.emit(
            event.component.list.UPDATE_DATA_OBJECT,
            result,
            this.#getDataObjectHandlerOptions(),
          )
          return result
        }
      }
    }

    return {
      index: null,
      dataObject: null,
      success: false,
    } as ListDataObjectOperationResult<DataObject>
  }

  get blueprint() {
    return this.#blueprint
  }
  /**
   * Since listItem components (rows) are not explicity written in the NOODL and
   * gives the responsibility for populating its data to the platforms, this means
   * we need a blueprint to render how the list items will be structured.
   * This function returns that structure
   */
  getBlueprint(): ListBlueprint {
    return this.#blueprint
  }

  setBlueprint(newBlueprint: ListBlueprint) {
    this.#blueprint = newBlueprint
    // console.log('newBlueprint', newBlueprint)
    return this
  }

  // @ts-expect-error
  child(index?: number) {
    if (!arguments.length) return this.#children[0]
    if (typeof index === 'number') return this.#children[index]
    return undefined
  }

  createChild(child: any) {
    forEachEntries(this.getBlueprint(), (k, v) => child.set(k, v))
    this.#children.push(child as any)
    child['listIndex'] = this.#children.indexOf(child as any)
    child.setParent(this as any)
    return child
  }

  hasChild<C extends Component>(child: C) {
    return this.#children.includes(child as any)
  }

  removeChild(index: number): Component | undefined
  removeChild(id: string): Component | undefined
  removeChild(child: Component): Component | undefined
  removeChild(): Component | undefined
  removeChild(child?: Component | number | string) {
    let removedChild: Component | ListItem | undefined
    if (!arguments.length) {
      removedChild = this.#children.shift()
    } else if (typeof child === 'number' && this.#children[child]) {
      removedChild = this.#children.splice(child, 1)[0]
    } else if (typeof child === 'string') {
      removedChild = child
        ? find(this.#children, (c) => c?.id === child)
        : undefined
    } else if (this.#children.includes(child as any)) {
      if (this.#children.includes(child as any)) {
        this.#children = this.#children.filter((c) => {
          if (c === (child as any)) {
            removedChild = child as any
            return false
          }
          return true
        })
      }
    }
    return removedChild
  }

  get(...args: Parameters<IComponent['get']>) {
    return super.get(...args)
  }

  set<
    K extends keyof ProxiedComponent | 'listObject' | 'listId' | 'iteratorVar'
  >(key: K, value: any, styleChanges?: any) {
    if (key === 'listObject') {
      // Refresh holdings of the list item data / children
      this.#listObject = value
    } else if (key === 'listId') {
      this.#listId = value
    } else if (key === 'iteratorVar') {
      this.#iteratorVar = value
    } else {
      super.set(key as string, value)
    }

    return this
  }

  emit<DataObject = any>(
    eventName:
      | 'add.data.object'
      | 'delete.data.object'
      | 'update.data.object'
      | 'retrieve.data.object',
    result: ListDataObjectOperationResult<DataObject>,
    args: ListDataObjectEventHandlerOptions,
  ): this
  emit<DataObject = any>(
    eventName:
      | 'create.list.item'
      | 'remove.list.item'
      | 'retrieve.list.item'
      | 'update.list.item',
    result: ListDataObjectOperationResult<DataObject> & {
      listItem: ListItem
    },
    args: ListDataObjectEventHandlerOptions,
  ): this
  emit<DataObject = any>(
    eventName:
      | 'add.data.object'
      | 'delete.data.object'
      | 'update.data.object'
      | 'retrieve.data.object'
      | 'create.list.item'
      | 'remove.list.item'
      | 'retrieve.list.item'
      | 'update.list.item',
    result:
      | ListDataObjectOperationResult<DataObject>
      | (ListDataObjectOperationResult<DataObject> & {
          listItem: ListItem
        }),
    opts: ListDataObjectEventHandlerOptions,
  ) {
    if (eventName in this.#cb) {
      this.#cb[eventName].forEach((cb) => cb(result, opts))
    }
    return this
  }

  on<DataObject = any>(
    eventName:
      | 'add.data.object'
      | 'delete.data.object'
      | 'update.data.object'
      | 'retrieve.data.object',
    cb: (
      result: ListDataObjectOperationResult<DataObject>,
      args: ListDataObjectEventHandlerOptions,
    ) => void,
  ): this
  on<DataObject = any>(
    eventName:
      | 'create.list.item'
      | 'remove.list.item'
      | 'retrieve.list.item'
      | 'update.list.item',
    cb: (
      result: ListDataObjectOperationResult<DataObject> & {
        listItem: ListItem
      },
      args: ListDataObjectEventHandlerOptions,
    ) => void,
  ): this
  on<DataObject = any>(
    eventName:
      | 'add.data.object'
      | 'delete.data.object'
      | 'update.data.object'
      | 'retrieve.data.object'
      | 'create.list.item'
      | 'remove.list.item'
      | 'retrieve.list.item'
      | 'update.list.item',
    cb: (
      result: ListDataObjectOperationResult<DataObject> & {
        listItem: ListItem
      },
      args: ListDataObjectEventHandlerOptions,
    ) => void,
  ): this {
    switch (eventName) {
      case 'add.data.object':
      case 'delete.data.object':
      case 'update.data.object':
      case 'retrieve.data.object':
      case 'create.list.item':
      case 'remove.list.item':
      case 'retrieve.list.item':
      case 'update.list.item':
        if (!Array.isArray(this.#cb[eventName])) this.#cb[eventName] = []
        this.#cb[eventName].push(cb)
    }
    return this
  }

  off(eventName: any, cb: Function) {
    if (this.#cb[eventName]) {
      const index = this.#cb[eventName]?.indexOf(cb)
      if (index > -1) this.#cb[eventName].splice(index, 1)
    }
    return this
  }

  hasCb(eventName: ListEventId, fn: Function) {
    return !!this.#cb[eventName]?.includes(fn)
  }

  clearCbs() {
    Object.entries(this.#cb).forEach(([k, v]) => {
      this.#cb[k].length = 0
    })
    return this
  }

  /**
   * Returns true if the child exists in the list of list items
   * @param { string | ListItemComponent } child
   */
  exists(id: string): boolean
  exists(child: ListItem): boolean
  exists(child: string | ListItem) {
    if (child) {
      if (typeof child === 'string') return this?.find(child)
      else return this.#children.includes(child)
    }
    return false
  }

  /**
   * Uses a child's id, the instance itself, its index or a predicate function
   *  and returns the list item instance if found, otherwise it returns undefined
   * @param { string | number | function | ListItemComponent } child
   */
  find(id: string): ListItem | undefined
  find(index: number): ListItem | undefined
  find(inst: ListItem): ListItem | undefined
  find(
    pred: (listItem: ListItem, index: number) => boolean,
  ): ListItem | undefined
  find(
    child:
      | string
      | number
      | ListItem
      | ((listItem: ListItem, index: number) => boolean),
  ) {
    if (typeof child === 'number') return this.#children[child]
    if (typeof child === 'function') return find(this.#children, child)
    const fn =
      typeof child === 'string'
        ? (c: ListItem) => !!c?.id && c.id === child
        : (c: ListItem) => c === child
    return find(this.#children, fn)
  }

  toJS() {
    return {
      blueprint: this.getBlueprint(),
      children: this.#children.map((child) => child.toJS()),
      listId: this.listId,
      listItemCount: this.length,
      listObject: this.#listObject,
      id: this?.id,
      iteratorVar: this.iteratorVar,
      style: this.style,
      type: this.type,
    } as ComponentObject
  }

  #getDataObjectHandlerOptions = (): ListDataObjectEventHandlerOptions => ({
    blueprint: this.getBlueprint(),
    listId: this.listId,
    iteratorVar: this.iteratorVar,
  })
}

export default List
