import _ from 'lodash'
import Logger from 'logsnap'
import {
  IComponent,
  IComponentConstructor,
  IComponentTypeInstance,
  IList,
  IListBlueprint,
  IListEventId,
  IListItem,
  IListDataObjectEventHandlerOptions,
  IListDataObjectOperationResult,
} from '../../types'
import Component from '../Base'
import { forEachEntries, getRandomKey } from '../../utils/common'
import { event } from '../../constants'
import { IComponentEventId } from '../../types'

const log = Logger.create('List')

class List extends Component implements IList {
  #blueprint: IListBlueprint
  #children: IListItem[] = []
  #listId: string
  #listObject: any[]
  #iteratorVar: string
  #cb: {
    init: Function[]
    [event.component.list.ADD_DATA_OBJECT]: Function[]
    [event.component.list.DELETE_DATA_OBJECT]: Function[]
    [event.component.list.RETRIEVE_DATA_OBJECT]: Function[]
    [event.component.list.UPDATE_DATA_OBJECT]: Function[]
    [event.component.list.CREATE_LIST_ITEM]: Function[]
    [event.component.list.REMOVE_LIST_ITEM]: Function[]
    [event.component.list.RETRIEVE_LIST_ITEM]: Function[]
    [event.component.list.UPDATE_LIST_ITEM]: Function[]
    [event.component.list.BLUEPRINT]: Function[]
  } = {
    init: [],
    [event.component.list.ADD_DATA_OBJECT]: [],
    [event.component.list.DELETE_DATA_OBJECT]: [],
    [event.component.list.RETRIEVE_DATA_OBJECT]: [],
    [event.component.list.UPDATE_DATA_OBJECT]: [],
    [event.component.list.CREATE_LIST_ITEM]: [],
    [event.component.list.REMOVE_LIST_ITEM]: [],
    [event.component.list.RETRIEVE_LIST_ITEM]: [],
    [event.component.list.UPDATE_LIST_ITEM]: [],
    [event.component.list.BLUEPRINT]: [],
  }

  constructor(...args: ConstructorParameters<IComponentConstructor>)
  constructor()
  constructor(...args: any | ConstructorParameters<IComponentConstructor>) {
    super(
      ...((args.length ? args : [{ type: 'list' }]) as ConstructorParameters<
        IComponentConstructor
      >),
    )
    log.func('constructor')
    log.gold(`Creating list component`, { args, component: this.toJS() })
    // These initial values will be set once in the prototype.
    // When we use .set, we will intercept the call and set them
    // on this instance instead
    this.set('listId', getRandomKey())
    this.set('listObject', this.get('listObject') || [])
    this.set('iteratorVar', this.get('iteratorVar') || '')
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

  children() {
    return this.#children
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
  ): IListDataObjectOperationResult<DataObject> {
    if (!_.isArray(this.#listObject)) this.#listObject = []
    this.#listObject.push(dataObject)
    const result = {
      index: this.#listObject.length - 1,
      dataObject,
      success: true,
    }
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
  ): IListDataObjectOperationResult {
    let result = {} as IListDataObjectOperationResult

    if (_.isArray(this.#listObject)) {
      // By index
      if (typeof index === 'number') {
        const dataObject = _.isArray(this.#listObject)
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
        if (_.isArray(this.#listObject)) {
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
          }
        }
      }
    } else {
      return {
        index,
        dataObject: null,
        success: false,
        error: 'listObject is empty',
      }
    }

    return { index, dataObject: null, success: false }
  }

  removeDataObject<DataObject>(
    pred: (dataObject: DataObject | null) => boolean,
  ): { index: number | null; dataObject: DataObject | null; success: boolean }
  removeDataObject<DataObject>(
    dataObject: DataObject,
  ): { index: number | null; dataObject: DataObject | null; success: boolean }
  removeDataObject<DataObject>(
    index: number,
  ): { index: number; dataObject: DataObject | null; success: boolean }
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
    if (dataObject != null) {
      let index
      let removedDataObject: any
      // By query func
      if (typeof dataObject === 'function') {
        const fn = dataObject
        index = _.findIndex(this.#listObject, fn)
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
        index = _.findIndex(this.#listObject, (obj) => obj === dataObject)
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
        removedDataObject = this.#listObject[index]
        console.log({ index, dataObject, data: this.getData() })
        console.log({ index, dataObject, data: this.getData() })
        this.#listObject = _.filter(
          this.#listObject,
          (o) => o !== removedDataObject,
        )
        const result = {
          index,
          dataObject: removedDataObject,
          success: !!removedDataObject,
        }
        if (!result.success) result['error'] = 'Could not find the dataObject'
        console.log({ index, dataObject, data: this.getData() })
        console.log({ index, dataObject, data: this.getData() })
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
    }
  }

  updateDataObject<DataObject = any>(
    index: number,
    dataObject: DataObject | null,
  ): { index: number; dataObject: DataObject | null; success: boolean }
  updateDataObject<DataObject = any>(
    pred: (dataObject: DataObject | null) => boolean,
    dataObject: DataObject | null,
  ): { index: number | null; dataObject: DataObject | null; success: boolean }
  updateDataObject<DataObject = any>(
    index: number | ((dataObject: DataObject | null) => boolean),
    dataObject: DataObject | null,
  ) {
    // By index
    if (_.isNumber(index)) {
      const prevDataObject = this.#listObject[index]
      this.#listObject[index] = _.isPlainObject(prevDataObject)
        ? { ...prevDataObject, ...dataObject }
        : _.isArray(prevDataObject)
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
    if (_.isFunction(index)) {
      const pred = index
      if (_.isArray(this.#listObject)) {
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

    return { index: null, dataObject: null, success: false }
  }

  /**
   * Since listItem components (rows) are not explicity written in the NOODL and
   * gives the responsibility for populating its data to the platforms, this means
   * we need a blueprint to render how the list items will be structured.
   * This function returns that structure
   */
  getBlueprint(): IListBlueprint {
    return this.#blueprint
  }

  setBlueprint(newBlueprint: IListBlueprint) {
    this.#blueprint = newBlueprint
    this.emit(event.component.list.BLUEPRINT, newBlueprint)
    return this
  }

  child(index?: number) {
    if (!arguments.length) return this.#children[0]
    if (_.isNumber(index)) return this.#children[index]
    return undefined
  }

  createChild<C extends IComponentTypeInstance>(child: C) {
    forEachEntries(this.getBlueprint(), (k, v) => child.set(k, v))
    this.#children.push(child)
    child['listIndex'] = this.#children.indexOf(child)
    child.setParent(this)
    return child
  }

  removeChild(index: number): IComponentTypeInstance | undefined
  removeChild(id: string): IComponentTypeInstance | undefined
  removeChild(child: IComponentTypeInstance): IComponentTypeInstance | undefined
  removeChild(): IComponentTypeInstance | undefined
  removeChild(child?: IComponentTypeInstance | number | string) {
    let removedChild: IComponentTypeInstance | undefined
    if (!arguments.length) {
      removedChild = this.#children.shift()
    } else if (_.isNumber(child) && this.#children[child]) {
      removedChild = this.#children.splice(child, 1)[0]
    } else if (_.isString(child)) {
      removedChild = child
        ? _.find(this.#children, (c) => c.id === child)
        : undefined
    } else if (this.#children.includes(child)) {
      if (this.#children.includes(child)) {
        this.#children = _.filter(this.#children, (c) => {
          if (c === child) {
            removedChild = child
            return false
          }
          return true
        })
      }
    }
    return removedChild
  }

  set(key: 'listId', value: string): this
  set(key: 'listObject', value: any[] | null): this
  set(key: 'iteratorVar', value: string): this
  set(...args: Parameters<IComponent['set']>) {
    const [key, value] = args

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

  emit(eventName: 'init'): this
  emit<E = 'blueprint'>(eventName: E, blueprint: IListBlueprint): this
  emit<E = 'redraw'>(eventName: E): this
  emit<E extends Exclude<IListEventId, 'blueprint'>>(
    eventName: E,
    result: IListDataObjectOperationResult,
    args: IListDataObjectEventHandlerOptions,
  ): this
  emit<Args extends any[]>(eventName: IListEventId, ...args: Args) {
    if (eventName in this.#cb) {
      _.forEach(this.#cb[eventName], (cb) => cb(...args))
    } else {
      // TODO emit in Component
    }
    return this
  }

  on<E = 'redraw'>(): this
  on<E = 'blueprint'>(
    eventName: E,
    cb: (blueprint: IListBlueprint) => void,
  ): this
  on<E extends Exclude<IListEventId, 'blueprint'>>(
    eventName: E | string,
    cb: (
      result: IListDataObjectOperationResult,
      args: IListDataObjectEventHandlerOptions,
    ) => void,
  ): this
  on<E extends IListEventId>(
    eventName: E | IComponentEventId,
    cb:
      | ((blueprint: IListBlueprint) => void)
      | ((
          result: IListDataObjectOperationResult,
          args: IListDataObjectEventHandlerOptions,
        ) => void),
  ) {
    if (!_.isArray(this.#cb[eventName])) this.#cb[eventName] = []
    this.#cb[eventName].push(cb)
    if (eventName in this.#cb) {
      // this.#cb[eventName].push(cb)
    } else {
      super.on(eventName, cb)
    }

    return this
  }

  // TODO - finish this
  off(eventName: any, cb: Function) {
    if (eventName in this.#cb) {
      if (this.#cb[eventName].includes(cb)) {
        //
      } else {
        //
      }
    } else {
      super.on(eventName as Parameters<IComponent['on']>[0], cb)
    }
    return this
  }

  /**
   * Returns true if the child exists in the list of list items
   * @param { string | ListItemComponent } child
   */
  exists(id: string): boolean
  exists(child: IListItem): boolean
  exists(child: string | IListItem) {
    if (child) {
      if (_.isString(child)) return this.find(child)
      else return this.#children.includes(child)
    }
    return false
  }

  /**
   * Uses a child's id, the instance itself, its index or a predicate function
   *  and returns the list item instance if found, otherwise it returns undefined
   * @param { string | number | function | ListItemComponent } child
   */
  find(id: string): IListItem | undefined
  find(index: number): IListItem | undefined
  find(inst: IListItem): IListItem | undefined
  find(
    pred: (listItem: IListItem, index: number) => boolean,
  ): IListItem | undefined
  find(
    child:
      | string
      | number
      | IListItem
      | ((listItem: IListItem, index: number) => boolean),
  ) {
    if (typeof child === 'number') return this.#children[child]
    if (typeof child === 'function') return _.find(this.#children, child)
    const fn =
      typeof child === 'string'
        ? (c: IListItem) => !!c.id && c.id === child
        : (c: IListItem) => c === child
    return _.find(this.#children, fn)
  }

  toJS() {
    return {
      blueprint: this.getBlueprint(),
      children: _.map(this.#children, (child) => child.toJS()),
      listId: this.listId,
      listItemCount: this.length,
      listObject: this.#listObject,
      id: this.id,
      iteratorVar: this.iteratorVar,
      style: this.style,
      type: this.type,
    }
  }

  #getDataObjectHandlerOptions = (): IListDataObjectEventHandlerOptions => ({
    blueprint: this.getBlueprint(),
    listId: this.listId,
    iteratorVar: this.iteratorVar,
    nodes: this.#children,
  })
}

export default List
