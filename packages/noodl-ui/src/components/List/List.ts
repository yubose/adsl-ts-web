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
  IComponentType,
} from '../../types'
import { forEachEntries, getRandomKey } from '../../utils/common'
import { forEachDeepChildren } from '../../utils/noodl'
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
  } = {
    [event.component.list.ADD_DATA_OBJECT]: [],
    [event.component.list.DELETE_DATA_OBJECT]: [],
    [event.component.list.RETRIEVE_DATA_OBJECT]: [],
    [event.component.list.UPDATE_DATA_OBJECT]: [],
  }

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
    this.#listObject = this.get('listObject') as any
    this.#listId = getRandomKey()
    this.#iteratorVar = this.get('iteratorVar') as string

    // Set the blueprint
    // TODO - a more official way
    this.#blueprint = this.getBlueprint()
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
   * Uses a child's id or the instance itself and returns the list item
   * instance if found, otherwise it returns undefined
   * @param { string | ListItemComponent } child
   */
  find(id: string): IListItem | undefined
  find(index: number): IListItem | undefined
  find(inst: IListItem): IListItem | undefined
  find(child: string | number | IListItem) {
    if (typeof child === 'number') return this.#children[child]
    const fn = _.isString(child)
      ? (c: IListItem) => !!c.id && c.id === child
      : (c: IListItem) => c === child
    return _.find(this.#children, fn)
  }

  addDataObject<DataObject>(dataObject: DataObject) {
    if (!_.isArray(this.#listObject)) this.#listObject = []
    this.#listObject.push(dataObject)
    const result = {
      index: this.#listObject.length - 1,
      dataObject,
      succeeded: true,
    } as IListDataObjectOperationResult
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
    // By index
    if (typeof index === 'number') {
      const dataObject = _.isArray(this.#listObject)
        ? this.#listObject[index]
        : null
      const result = { index, dataObject, succeeded: true }
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
            const result = { index, dataObject, succeeded: true }
            this.emit(
              event.component.list.RETRIEVE_DATA_OBJECT,
              result,
              this.#getDataObjectHandlerOptions(),
            )
            return result
          }
        }
      }
    }

    return { index: null, dataObject: null, succeeded: false }
  }

  // insertDataObject<DataObject = any>(
  //   dataObject: DataObject | null,
  //   index: number,
  // ) {}

  removeDataObject<DataObject>(
    pred: (dataObject: DataObject | null) => boolean,
  ): { index: number | null; dataObject: DataObject | null; succeeded: boolean }
  removeDataObject<DataObject>(
    dataObject: DataObject,
  ): { index: number | null; dataObject: DataObject | null; succeeded: boolean }
  removeDataObject<DataObject>(
    index: number,
  ): { index: number; dataObject: DataObject | null; succeeded: boolean }
  removeDataObject<DataObject = any>(
    dataObject: DataObject | number | ((pred: DataObject | null) => boolean),
  ) {
    if (!Array.isArray(this.#listObject)) {
      return {
        index: typeof dataObject === 'number' ? dataObject : null,
        dataObject: typeof dataObject === 'object' ? dataObject : null,
        succeeded: false,
      }
    }
    if (dataObject != null) {
      if (typeof dataObject === 'function') {
        const fn = dataObject
        const index = _.findIndex(this.#listObject, fn)
        const result = {
          index,
          dataObject: this.#listObject.splice(index, 1)[0],
          succeeded: true,
        }
        this.emit(
          event.component.list.DELETE_DATA_OBJECT,
          result,
          this.#getDataObjectHandlerOptions(),
        )
        return result
      }

      if (typeof dataObject === 'object') {
        const index = _.findIndex(this.#listObject, (obj) => obj === dataObject)
        if (index !== -1) this.#listObject.splice(index, 1)[0]
        const result = {
          index: index === -1 ? null : index,
          dataObject,
          succeeded: true,
        }
        this.emit(
          event.component.list.DELETE_DATA_OBJECT,
          result,
          this.#getDataObjectHandlerOptions(),
        )
      }

      if (typeof dataObject === 'number') {
        const index = dataObject
        const result = {
          index,
          dataObject: this.#listObject.splice(index, 1),
          succeeded: true,
        }
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
      succeeded: false,
    }
  }

  setDataObject<DataObject = any>(
    index: number,
    dataObject: DataObject | null,
  ): { index: number; dataObject: DataObject | null; succeeded: boolean }
  setDataObject<DataObject = any>(
    pred: (dataObject: DataObject | null) => boolean,
    dataObject: DataObject | null,
  ): { index: number | null; dataObject: DataObject | null; succeeded: boolean }
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
          succeeded: true,
        }
        this.emit(
          event.component.list.UPDATE_DATA_OBJECT,
          result,
          this.#getDataObjectHandlerOptions(),
        )
        return result
      } else {
        return { index, dataObject, succeeded: false }
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
              succeeded: true,
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
          const result = { index: 0, dataObject, succeeded: true }
          this.emit(
            event.component.list.UPDATE_DATA_OBJECT,
            result,
            this.#getDataObjectHandlerOptions(),
          )
          return result
        }
      }
    }

    return { index: null, dataObject: null, succeeded: false }
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

  createChild<K extends NOODLComponentType>(
    ...args: Parameters<IComponent['createChild']>
  ): IComponentTypeInstance<K> | undefined {
    const child = super.createChild(...args)
    if (child?.noodlType === 'listItem') {
      forEachEntries(this.getBlueprint(), (k, v) => child.set(k, v))
      this.#children.push(child as IListItem)
    }
    return child as IComponentTypeInstance<K>
  }

  removeChild(...args: Parameters<IComponent['removeChild']>) {
    const removedChild = super.removeChild(...args)
    if (removedChild && this.#children.includes(removedChild as IListItem)) {
      this.#children = this.#children.filter((c) => c !== removedChild)
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
