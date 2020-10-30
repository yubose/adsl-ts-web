import _ from 'lodash'
import Logger from 'logsnap'
import {
  IComponent,
  IComponentConstructor,
  IListComponent,
  IListComponentBlueprint,
  IListComponentListObject,
  IListComponentHandleBlueprintProps,
  IListComponentUpdateProps,
  IListItemComponent,
  ProxiedComponent,
} from './types'
import { getRandomKey } from './utils/common'
import Component from './Component'
import ListItemComponent from './ListItemComponent'

const log = Logger.create('ListComponent')

class ListComponent extends Component implements IListComponent {
  #data: any[] | null = null
  #blueprint: IListComponentBlueprint = { type: 'listItem' }
  #children: IListItemComponent[] = []
  #listId: string
  #cb: {
    blueprint: Function[]
    data: Function[]
    update: Function[]
  } = { blueprint: [], data: [], update: [] }

  constructor(...args: ConstructorParameters<IComponentConstructor>)
  constructor()
  constructor(...args: any | ConstructorParameters<IComponentConstructor>) {
    super(
      ...((args.length ? args : [{ type: 'list' }]) as ConstructorParameters<
        IComponentConstructor
      >),
    )
    const listObject = this.get('listObject')
    const iteratorVar = this.get('iteratorVar')

    // Set the blueprint
    // TODO - a more official way
    if (_.isArray(super.original?.children)) {
      const rawChildren = super.original.children
      if (rawChildren.length) {
        const blueprint = rawChildren[0]
        if (_.isObject(blueprint)) {
          this.#blueprint = blueprint
          if (!('type' in this.#blueprint)) this.#blueprint['type'] = 'listItem'
          this.emit('blueprint', this.#getBlueprintHandlerArgs(listObject))
        }
      }
    }

    if (listObject) {
      if (_.isArray(listObject)) {
        _.forEach(listObject, (dataObject) => {
          const child = new ListItemComponent({ iteratorVar })
          child.set(iteratorVar, dataObject)
          this.createChild(child)
        })
      } else {
        const child = new ListItemComponent({ iteratorVar })
        child.setDataObject(listObject)
        this.createChild(child)
      }
    }

    this.set('listId', getRandomKey())
  }

  get iteratorVar() {
    return this.get('iteratorVar') || ''
  }

  get listId() {
    return this.#listId
  }

  get listObject() {
    return this.get('listObject')
  }

  get length() {
    return this.#children.length
  }

  /**
   * Returns true if the child exists in the list of list items
   * @param { string | ListItemComponent } child
   */
  exists(child: string | IListItemComponent) {
    return (
      !!child &&
      !!(child instanceof ListItemComponent
        ? this.#children.includes(child as IListItemComponent)
        : this.find(child))
    )
  }

  /**
   * Uses a child's id or the instance itself and returns the list item
   * instance if found, otherwise it returns undefined
   * @param { string | ListItemComponent } child
   */
  find(child: string | number | IListItemComponent) {
    if (typeof child === 'number') return this.#children[child]
    const fn = _.isString(child)
      ? (c: IListItemComponent) => !!c.id && c.id === child
      : (c: IListItemComponent) => c === child
    return _.find(this.#children, fn)
  }

  getData({ fromNodes = false }: { fromNodes?: boolean } = {}) {
    return (
      (fromNodes
        ? this.#children.map((c) => c.get(this.iteratorVar))
        : this.#data) || null
    )
  }

  getDataObject(index: number): any
  getDataObject(childId: string | number): any
  getDataObject(child: IComponent): any
  getDataObject(child: number | string | IComponent) {
    let _inst: IComponent | undefined
    // Child component id
    if (_.isString(child)) {
      _inst = _.find(this.#children, (c) => c.id == child)
    } else if (_.isNumber(child)) {
      // Child index
      _inst = this.#children[child]
    } else if (child instanceof Component) {
      _inst = child
    }
    return _inst && _inst.get(this.iteratorVar)
  }

  setDataObject(c: number | string | IListItemComponent, data: any) {
    const child = this.find(c)
    child?.set(this.iteratorVar, data)
    return this
  }

  createChild(...args: Parameters<IComponent['createChild']>) {
    const child = super.createChild(...args)
    if (child?.noodlType === 'listItem') {
      child.set('listId', this.listId)
      this.#children.push(child as IListItemComponent)
    }
    return child
  }

  removeChild(...args: Parameters<IComponent['removeChild']>) {
    const removedChild = super.removeChild(...args)
    if (
      removedChild &&
      this.#children.includes(removedChild as IListItemComponent)
    ) {
      this.#children = this.#children.filter((c) => c !== removedChild)
    }
    return removedChild
  }

  set(key: 'listId', value: string): this
  set(key: 'listObject', value: any[]): this
  set(key: 'blueprint', value: any): this
  set(...args: Parameters<IComponent['set']>) {
    const [key, value] = args

    if (key === 'listObject') {
      // Refresh holdings of the list item data / children
      const listObject = value
      this.#data = listObject
      // TODO - this.emit('data')
      this.emit('blueprint', this.#getBlueprintHandlerArgs(listObject))
      this.emit('update', this.#getUpdateHandlerArgs(listObject))
    } else if (key === 'listId') {
      this.#listId = value
    }

    super.set(key as string, value)
    return this
  }

  on<E extends 'blueprint' | 'data' | 'update'>(
    eventName: E | string,
    cb: Function,
  ) {
    if (eventName in this.#cb) {
      if (this.#cb[eventName as E].includes(cb)) {
        log.func('on("blueprint")')
        log.red(
          'Attempted to add a duplicate callback. The duplicate was not added',
        )
      } else {
        this.#cb[eventName as E].push(cb)
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
  emit<E extends 'blueprint' | 'data' | 'update'>(
    eventName: E | string,
    ...args: any[]
  ) {
    if (eventName in this.#cb) {
      _.forEach(this.#cb[eventName as E], (cb) => cb(...args))
    } else {
      // TODO emit in Component
    }
    return this
  }

  #getBlueprintHandlerArgs = (listObject: IListComponentListObject) =>
    ({
      baseBlueprint: this.#getDefaultBlueprint(listObject),
      currentBlueprint: this.#blueprint,
      iteratorVar: this.iteratorVar,
      listObject,
      nodes: this.#children,
      raw: super.child()?.original || this.#getDefaultBlueprint(listObject),
      update: (blueprint: IListComponentBlueprint) =>
        (this.#blueprint = blueprint),
    } as IListComponentHandleBlueprintProps)

  #getDefaultBlueprint = (
    listObject: IListComponentListObject,
  ): Partial<ProxiedComponent> => {
    if (!listObject) return { type: 'listItem' }
    const dataObject = listObject?.[0] || {}
    dataObject['iteratorVar'] = this.iteratorVar
    return dataObject
  }

  #getUpdateHandlerArgs = (listObject: IListComponentListObject) =>
    ({
      blueprint: this.#blueprint,
      iteratorVar: this.iteratorVar,
      listObject,
      nodes: this.#children,
    } as IListComponentUpdateProps)
}

export default ListComponent
