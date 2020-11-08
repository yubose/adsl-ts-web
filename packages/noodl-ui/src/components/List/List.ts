import _ from 'lodash'
import Logger from 'logsnap'
import {
  IComponent,
  IComponentConstructor,
  IList,
  IListBlueprint,
  IListEventId,
  IListEventObject,
  IListItem,
  IListDataObjectEventHandlerOptions,
  IListDataObjectOperationResult,
  ProxiedComponent,
  NOODLComponentType,
  IComponentTypeInstance,
} from '../../types'
import { forEachEntries, getRandomKey } from '../../utils/common'
import { forEachDeepChildren } from '../../utils/noodl'
import createChild from '../../utils/createChild'
import { event } from '../../constants'
import { IComponentEventId } from '../../types'
import Component from '../Base'

const log = Logger.create('List')

class List extends Component implements IList {
  #blueprint: IListBlueprint
  #children: IListItem[] = []
  #listId: string
  #listObject: any[] | null = null
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
  #items: {
    [listItemId: string]: {
      dataObject: any
      listItem: IListItem | null
    }
  } = {}

  constructor(...args: ConstructorParameters<IComponentConstructor>)
  constructor()
  constructor(...args: any | ConstructorParameters<IComponentConstructor>) {
    super(
      ...((args.length ? args : [{ type: 'list' }]) as ConstructorParameters<
        IComponentConstructor
      >),
    )
    // These initial values will be set once in the prototype.
    // When we use .set, we will intercept the call and set them
    // on this instance instead
    this.#blueprint = this.getBlueprint()
    this.#listId = getRandomKey()
    this.#listObject = this.get('listObject') as any
    this.#iteratorVar = this.get('iteratorVar') as string

    // super.removeChild()

    log.func('constructor')
    log.gold(`Creating list component`, { args, component: this.toJS() })

    this.on(event.component.list.ADD_DATA_OBJECT, (result, options) => {
      log.func(`on[${event.component.list.ADD_DATA_OBJECT}]`)
      const listItem = this.createChild('listItem') as IListItem
      listItem?.set('listIndex', result.index)
      listItem?.setDataObject?.(result.dataObject)
      this.#items[listItem.id] = {
        dataObject: result.dataObject,
        listItem,
      }
      log.green(`Created a new listItem`, { ...result, ...options, listItem })
      this.emit(event.component.list.CREATE_LIST_ITEM, { ...result, listItem })
    })

    this.on(event.component.list.DELETE_DATA_OBJECT, (result, options) => {
      log.func(`on[${event.component.list.DELETE_DATA_OBJECT}]`)
      const listItem = this.find(
        (child) => child?.getDataObject?.() === result.dataObject,
      )
      if (listItem) this.removeChild(listItem)
      log.green(`Deleted a listItem`, { ...result, ...options, listItem })
      this.emit(event.component.list.REMOVE_LIST_ITEM, { ...result, listItem })
    })

    this.on(event.component.list.RETRIEVE_DATA_OBJECT, (result, options) => {
      log.func(`on[${event.component.list.RETRIEVE_DATA_OBJECT}]`)
      log.gold(`Retrieved a dataObject`, { result, ...options })
    })

    this.on(event.component.list.UPDATE_DATA_OBJECT, (result, options) => {
      log.func(`on[${event.component.list.UPDATE_DATA_OBJECT}]`)
      const listItem: IListItem | undefined = this.#children[result.index]
      listItem?.setDataObject?.(result.dataObject)
      log.green(`Updated dataObject`, { result, ...options })
      this.emit(event.component.list.UPDATE_LIST_ITEM, {
        ...result,
        listItem,
      })
    })

    if (this.#listObject) {
      if (_.isArray(this.#listObject)) {
        _.forEach(this.#listObject, (dataObject) => {
          this.addDataObject(dataObject)
          log.green(`Saved dataObject`, dataObject)
        })
      } else {
        log.gold(`listObject was unavailable. No data will be set`)
      }
    }
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
  ) {
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

  // insertDataObject<DataObject = any>(
  //   dataObject: DataObject | null,
  //   index: number,
  // ) {}

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
      let removedDataObject
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
      if (typeof dataObject === 'object') {
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
      if (typeof dataObject === 'number') {
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
    }
  }

  setDataObject<DataObject = any>(
    index: number,
    dataObject: DataObject | null,
  ): { index: number; dataObject: DataObject | null; success: boolean }
  setDataObject<DataObject = any>(
    pred: (dataObject: DataObject | null) => boolean,
    dataObject: DataObject | null,
  ): { index: number | null; dataObject: DataObject | null; success: boolean }
  setDataObject<DataObject = any>(
    index: number | ((dataObject: DataObject | null) => boolean),
    dataObject: DataObject | null,
  ) {
    if (typeof index === 'number') {
      if (_.isArray(this.#listObject)) {
        this.#listObject[index] = dataObject
        const result = {
          index,
          dataObject: this.#listObject[index] || null,
          success: true,
        }
        this.emit(
          event.component.list.UPDATE_DATA_OBJECT,
          result,
          this.#getDataObjectHandlerOptions(),
        )
        return result
      } else {
        return { index, dataObject, success: false }
      }
    }

    if (typeof index === 'function') {
      const pred = index
      if (_.isArray(this.#listObject)) {
        const numDataObjects = this.#listObject.length
        for (let i = 0; i < numDataObjects; i++) {
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

  getData({ fromNodes = false }: { fromNodes?: boolean } = {}) {
    return (
      (fromNodes
        ? this.#children.map((c) => c.get(this.iteratorVar))
        : this.#listObject) || null
    )
  }

  /**
   * Since listItem components (rows) are not explicity written in the NOODL and
   * gives the responsibility for populating its data to the platforms, this means
   * we need a blueprint to render how the list items will be structured.
   * This function returns that structure
   */
  getBlueprint(): IListBlueprint {
    let blueprint: IListBlueprint | undefined
    let originalChildren: ProxiedComponent | undefined

    const commonProps = {
      listId: this.listId,
      iteratorVar: this.iteratorVar,
    }

    if (_.isObject(this.original)) {
      if (_.isArray(this.original.children)) {
        const targetChild = this.original.children[0]
        originalChildren = _.isObject(targetChild)
          ? targetChild
          : _.isString(targetChild)
          ? { type: targetChild }
          : { type: 'listItem' }
      } else if (_.isObject(this.original.children)) {
        originalChildren = this.original.children
      }
    } else if (_.isString(this.original)) {
      originalChildren = { type: this.original }
    }

    blueprint = {
      ...originalChildren,
      ...commonProps,
      style: { ...originalChildren?.style },
    }

    if (blueprint.children) {
      forEachDeepChildren(blueprint, _.partialRight(_.assign, commonProps))
    }

    if ('id' in blueprint) delete blueprint.id

    return blueprint
  }

  createChild<C extends IComponentTypeInstance>(child: C) {
    if (child?.noodlType === 'listItem') {
      forEachEntries(this.getBlueprint(), (k, v) => child.set(k, v))
      child.setParent(this)
      this.#children.push(child as IListItem)
    }
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
      const listObject = value
      this.#listObject = listObject
      return this
    } else if (key === 'listId') {
      this.#listId = value
      return this
    } else if (key === 'iteratorVar') {
      this.#iteratorVar = value
      return this
    }

    super.set(key as string, value)
    return this
  }

  on<E extends IListEventId>(
    eventName: E | string,
    cb: (
      result: IListDataObjectOperationResult,
      args: IListDataObjectEventHandlerOptions,
    ) => void,
  ): this
  on<E extends IListEventId>(
    eventName: E | IComponentEventId,
    cb: (
      result: IListDataObjectOperationResult,
      args: IListDataObjectEventHandlerOptions,
    ) => void,
  ) {
    if (eventName !== 'resolved' && eventName in this.#cb) {
      if (this.#cb[eventName].includes(cb)) {
        log.func('on("blueprint")')
        log.red(
          'Attempted to add a duplicate callback. The duplicate was not added',
        )
      } else {
        this.#cb[eventName].push(cb)
      }
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

  // TODO - finish this
  emit<DataObject>(
    eventName: IListEventObject['ADD_DATA_OBJECT'],
    result: IListDataObjectOperationResult,
    options: IListDataObjectEventHandlerOptions,
  ): this
  emit(
    eventName: IListEventObject['DELETE_DATA_OBJECT'],
    result: IListDataObjectOperationResult,
    options: IListDataObjectEventHandlerOptions,
  ): this
  emit<DataObject>(
    eventName: IListEventObject['RETRIEVE_DATA_OBJECT'],
    result: IListDataObjectOperationResult,
    options: IListDataObjectEventHandlerOptions,
  ): this
  emit(
    eventName: IListEventObject['UPDATE_DATA_OBJECT'],
    result: IListDataObjectOperationResult,
    options: IListDataObjectEventHandlerOptions,
  ): this
  emit<Args extends any[]>(eventName: IListEventId, ...args: Args) {
    if (eventName in this.#cb) {
      _.forEach(this.#cb[eventName], (cb) => cb(...args))
    } else {
      // TODO emit in Component
    }
    return this
  }

  #getDataObjectHandlerOptions = (): IListDataObjectEventHandlerOptions => ({
    blueprint: this.getBlueprint(),
    listId: this.listId,
    listObject: this.getData(),
    iteratorVar: this.iteratorVar,
    nodes: this.#children,
  })
}

export default List
