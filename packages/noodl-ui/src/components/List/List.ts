import _ from 'lodash'
import Logger from 'logsnap'
import {
  IComponent,
  IComponentConstructor,
  IList,
  IListBlueprint,
  IListListObject,
  IListHandleBlueprintProps,
  IListItem,
  ProxiedComponent,
} from '../../types'
import { forEachEntries, getRandomKey } from '../../utils/common'
import { forEachDeepChildren } from '../../utils/noodl'
import Component from '../Base/Base'
import ListItemComponent from '../ListItem'

const log = Logger.create('List')

class List extends Component implements IList {
  #blueprint: IListBlueprint = { type: 'listItem' }
  #children: IListItem[] = []
  #listId: string
  #listObject: any[] | null = null
  #iteratorVar: string
  #cb: {
    created: Function[]
  } = { created: [] }

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
  exists(child: string | IListItem) {
    return (
      !!child &&
      !!(child instanceof ListItemComponent
        ? this.#children.includes(child as IListItem)
        : this.find(child))
    )
  }

  /**
   * Uses a child's id or the instance itself and returns the list item
   * instance if found, otherwise it returns undefined
   * @param { string | ListItemComponent } child
   */
  find(child: string | number | IListItem) {
    if (typeof child === 'number') return this.#children[child]
    const fn = _.isString(child)
      ? (c: IListItem) => !!c.id && c.id === child
      : (c: IListItem) => c === child
    return _.find(this.#children, fn)
  }

  getData({ fromNodes = false }: { fromNodes?: boolean } = {}) {
    return (
      (fromNodes
        ? this.#children.map((c) => c.get(this.iteratorVar))
        : this.#listObject) || null
    )
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
      this.emit('blueprint', this.#getBlueprintHandlerArgs(listObject))
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
    event: E,
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

  #getBlueprintHandlerArgs = (listObject: IListListObject) =>
    ({
      baseBlueprint: this.#getDefaultBlueprint(listObject),
      currentBlueprint: this.#blueprint,
      iteratorVar: this.iteratorVar,
      listObject,
      nodes: this.#children,
      raw: super.child()?.original || this.#getDefaultBlueprint(listObject),
      merge: this.mergeBlueprint,
      replace: this.replaceBlueprint,
      reset: this.resetBlueprint,
    } as IListHandleBlueprintProps)

  #getDefaultBlueprint = (
    listObject: IListListObject,
  ): Partial<ProxiedComponent> => {
    if (!listObject) return { type: 'listItem' }
    const dataObject = listObject?.[0] || {}
    dataObject['iteratorVar'] = this.iteratorVar
    return dataObject
  }

  #getUpdateHandlerArgs = (listObject: IListListObject) =>
    ({
      blueprint: this.#blueprint,
      iteratorVar: this.iteratorVar,
      listObject,
      nodes: this.#children,
    } as IListUpdateProps)
}

export default List
