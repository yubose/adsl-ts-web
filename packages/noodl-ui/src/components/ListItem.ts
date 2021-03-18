import { ComponentObject } from 'noodl-types'
import Component from './Base'
import {
  ComponentInstance,
  ComponentConstructor,
  IComponent,
  ProxiedComponent,
} from '../types'

class ListItem extends Component implements IComponent {
  #children: any[] = []
  #dataObject: any
  #listId: string = ''
  #listIndex: null | number = null
  #iteratorVar: string = ''
  #cb = { redraw: [] }
  hasDataObject: boolean = false
  values: { [dataKey: string]: any }

  constructor(...args: ConstructorParameters<ComponentConstructor>)
  constructor()
  constructor(...args: any | ConstructorParameters<ComponentConstructor>) {
    super(
      ...((args.length
        ? args
        : [
            { type: 'listItem' },
          ]) as ConstructorParameters<ComponentConstructor>),
    )
  }

  child(index?: number) {
    if (!arguments.length) return this.#children[0]
    return typeof index === 'number' ? this.#children[index] : undefined
  }

  children {
    return this.#children
  }

  get length() {
    return this.#children.length
  }

  get listId() {
    return this.#listId
  }

  set listId(listId) {
    this.#listId = listId
  }

  get listIndex() {
    return this.#listIndex
  }

  set listIndex(listIndex) {
    this.#listIndex = listIndex
  }

  get iteratorVar() {
    return this.#iteratorVar
  }

  set iteratorVar(iteratorVar: string) {
    this.#iteratorVar = iteratorVar
  }

  get(...args: Parameters<IComponent['get']>) {
    if (args[0] === 'iteratorVar') return this.iteratorVar
    if (args[0] === 'listId') return this.listId
    if (args[0] === 'listIndex') return this.listIndex
    return super.get(args[0], args[1])
  }

  set<K extends keyof ProxiedComponent>(
    key: K | 'iteratorVar' | 'listId' | 'listIndex',
    value: any,
    styleChanges?: any,
  ) {
    if (key === 'iteratorVar') this['iteratorVar'] = value
    else if (key === 'listId') this['listId'] = value
    else if (key === 'listIndex') this['listIndex'] = value
    else super.set(key as any, value, styleChanges)
    return this
  }

  createChild<C extends ComponentInstance>(child: C): C {
    if (child) {
      ;(child as any).setParent?.(this)
      ;(child as any).set('listId', this.listId)
      ;(child as any).set('listIndex', this.listIndex)
    }
    this.#children.push(child)
    return child
  }

  hasChild<C extends ComponentInstance>(child: C) {
    return this.#children.includes(child)
  }

  // @ts-expect-error
  removeChild<C extends ComponentInstance = any>(child: C) {
    if (child) {
      const index = this.#children.indexOf(child)
      if (index > -1) return this.#children.splice(index, 1)[0]
    }
    return child
  }

  getDataObject() {
    return this.#dataObject
  }

  setDataObject<T>(data: T) {
    this.#dataObject = data
    this.hasDataObject = !!this.#dataObject
    return this
  }

  toJS() {
    return {
      children: this.#children.map((child) => child.toJS?.()),
      dataObject: this.getDataObject(),
      listId: this.listId,
      listIndex: this.listIndex,
      id: this.id,
      iteratorVar: this.iteratorVar,
      noodlType: this.noodlType,
      style: this.style,
      type: this.type,
    } as ComponentObject
  }

  on(eventName: string, cb: Function) {
    if (eventName) {
      this.#cb[eventName] = Array.isArray(this.#cb[eventName])
        ? [...this.#cb[eventName], cb]
        : [cb]
    }
    return this
  }

  clearCbs() {
    Object.keys(this.#cb).forEach((name) => {
      if (Array.isArray(this.#cb[name])) {
        this.#cb[name].length = 0
      }
    })
    return this
  }

  emit(eventName: string, ...args: any[]) {
    ;(this.#cb[eventName] || []).forEach((fn) => fn(...args))
    return this
  }
}

export default ListItem
