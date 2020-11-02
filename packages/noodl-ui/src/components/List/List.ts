import _ from 'lodash'
import Logger from 'logsnap'
import {
  IComponent,
  IComponentConstructor,
  IList,
  IListBlueprint,
  IListEventId,
  IListEventObject,
  IListListObject,
  IListItem,
  ProxiedComponent,
} from '../../types'
import { forEachEntries, getRandomKey } from '../../utils/common'
import { forEachDeepChildren } from '../../utils/noodl'
import Component from '../Base/Base'
import ListItemComponent from '../ListItem'
import { event } from '../../constants'

const log = Logger.create('List')

class List extends Component implements IList {
  #blueprint: IListBlueprint = { type: 'listItem' }
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

    if (this.#listObject) {
      if (_.isArray(this.#listObject)) {
        // _.forEach(this.#listObject, (dataObject) => {
        //   const child = new ListItemComponent({
        //     iteratorVar: this.#iteratorVar,
        //   })
        //   child.set(this.#iteratorVar, dataObject)
        //   this.createChild(child)
        // })
      } else {
        // const child = new ListItemComponent({ iteratorVar: this.#iteratorVar })
        // child.setDataObject(this.#listObject)
        // this.createChild(child)
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
    }
    this.emit(event.component.list.ADD_DATA_OBJECT, result)
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
      const result = { index, dataObject }
      this.emit(event.component.list.RETRIEVE_DATA_OBJECT, result)
      return result
    }
    // By query
    if (typeof index === 'function') {
      const query = index
      if (_.isArray(this.#listObject)) {
        for (let index = 0; index < this.#listObject.length; index++) {
          const dataObject = this.#listObject[index]
          if (query(dataObject)) {
            const result = { index, dataObject }
            this.emit(event.component.list.RETRIEVE_DATA_OBJECT, result)
            return result
          }
        }
      }
    }
  }

  insertDataObject<DataObject = any>(
    dataObject: DataObject | null,
    index: number,
  ) {}

  removeDataObject<DataObject = any>() {
    return this
  }

  setDataObject<DataObject = any>() {
    return this
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

  // getDataObject(index: number): any
  // getDataObject(childId: string | number): any
  // getDataObject(child: IComponent): any
  // getDataObject(child: number | string | IComponent) {
  //   let _inst: IComponent | undefined
  //   // Child component id
  //   if (_.isString(child)) {
  //     _inst = _.find(this.#children, (c) => c.id == child)
  //   } else if (_.isNumber(child)) {
  //     // Child index
  //     _inst = this.#children[child]
  //   } else if (child instanceof Component) {
  //     _inst = child
  //   }
  //   return _inst && _inst.get(this.iteratorVar)
  // }

  // setDataObject(c: number | string | IListItem, data: any) {
  //   const child = this.find(c)
  //   child?.set(this.iteratorVar, data)
  //   return this
  // }

  createChild(...args: Parameters<IComponent['createChild']>) {
    const child = super.createChild(...args)
    if (child?.noodlType === 'listItem') {
      forEachEntries(this.getBlueprint(), (key, value) => {
        child.set(key, value)
      })
      this.#children.push(child as IListItem)
      this.emit('create.list.item', child, {
        data: this.getData(),
        nodes: this.#children,
      })
    }
    return child
  }

  removeChild(...args: Parameters<IComponent['removeChild']>) {
    const removedChild = super.removeChild(...args)
    if (removedChild && this.#children.includes(removedChild as IListItem)) {
      this.#children = this.#children.filter((c) => c !== removedChild)
      this.emit('remove.list.item', {
        data: this.getData(),
        currentNodes: this.#children,
        removedNode: removedChild,
      })
    }
    return removedChild
  }

  set(key: 'listId', value: string): this
  set(key: 'listObject', value: any[]): this
  set(...args: Parameters<IComponent['set']>) {
    const [key, value] = args

    if (key === 'listObject') {
      // Refresh holdings of the list item data / children
      const listObject = value
      this.#listObject = listObject
      // TODO - this.emit('data')
      this.emit('data', this.getData(), {
        blueprint: this.#blueprint,
        nodes: this.#children,
      })
      this.emit('update', this.#getUpdateHandlerArgs(listObject))
      return this
    } else if (key === 'listId') {
      this.#listId = value
      return this
    }

    super.set(key as string, value)
    return this
  }

  on<E extends string = 'create.list.item'>(
    eventName: E,
    cb: (opts: { hello: [] }) => void,
  ): this
  on(eventName: string, cb: Function) {
    if (eventName in this.#cb) {
      if (this.#cb[eventName].includes(cb)) {
        log.func('on("blueprint")')
        log.red(
          'Attempted to add a duplicate callback. The duplicate was not added',
        )
      } else {
        this.#cb[eventName].push(cb)
      }
    } else {
      super.on(eventName as Parameters<IComponent['on']>[0], cb)
    }
    return this
  }

  // TODO - finish this
  off<E extends 'blueprint' | 'data' | 'update'>(
    eventName: E | string,
    cb: Function,
  ) {
    if (eventName in this.#cb) {
      if (this.#cb[eventName as E].includes(cb)) {
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
    result: { index: number; dataObject: DataObject },
  ): this
  emit(eventName: IListEventObject['DELETE_DATA_OBJECT']): this
  emit<DataObject>(
    eventName: IListEventObject['RETRIEVE_DATA_OBJECT'],
    dataObject: DataObject,
  ): DataObject
  emit(eventName: IListEventObject['UPDATE_DATA_OBJECT']): this
  emit<Args extends any[]>(eventName: IListEventId, ...args: Args) {
    if (eventName in this.#cb) {
      _.forEach(this.#cb[eventName], (cb) => cb(...args))
    } else {
      // TODO emit in Component
    }
    return this
  }

  #getUpdateHandlerArgs = (listObject: IListListObject) =>
    ({
      blueprint: this.#blueprint,
      iteratorVar: this.iteratorVar,
      listObject,
      nodes: this.#children,
    } as any)
}

export default List
