import _ from 'lodash'
import Component from '../Base'
import {
  IComponent,
  IComponentConstructor,
  IComponentTypeInstance,
  IListItem,
  NOODLComponentType,
} from '../../types'

class ListItem<K extends NOODLComponentType = 'listItem'>
  extends Component
  implements IListItem<K> {
  #children: any[] = []
  #dataObject: any
  #listId: string = ''
  #listIndex: null | number = null
  #iteratorVar: string = ''
  #cb = { redraw: [] }

  constructor(...args: ConstructorParameters<IComponentConstructor>)
  constructor()
  constructor(...args: any | ConstructorParameters<IComponentConstructor>) {
    super(
      ...((args.length
        ? args
        : [{ type: 'listItem' }]) as ConstructorParameters<
        IComponentConstructor
      >),
    )
  }

  child(index?: number) {
    if (!arguments.length) return this.#children[0]
    return _.isNumber(index) ? this.#children[index] : undefined
  }

  children() {
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

  set(...args: Parameters<IComponent['set']>) {
    const [key, value] = args
    if (key === 'iteratorVar') this['iteratorVar'] = value
    else if (key === 'listId') this['listId'] = value
    else if (key === 'listIndex') this['listIndex'] = value
    else super.set(...args)
    return this
  }

  createChild<C extends IComponentTypeInstance>(child: C): C {
    child?.setParent?.(this)
    child['listId'] = this.listId
    child['listIndex'] = this.listIndex
    this.#children.push(child)
    return child
  }

  getDataObject() {
    return this.#dataObject
  }

  setDataObject<T>(data: T) {
    this.#dataObject = data
    return this
  }

  toJS() {
    return {
      children: _.map(this.#children, (child) => child.toJS?.()),
      dataObject: this.getDataObject(),
      listId: this.listId,
      listIndex: this.listIndex,
      iteratorVar: this.iteratorVar,
      noodlType: this.noodlType,
      style: this.style,
      type: this.type,
    }
  }

  on<E = 'redraw'>(eventName: E, cb) {
    if (eventName === 'redraw') {
      // Restricting redraw to one handler only
      if (this.#cb.redraw.length) return
      this.#cb.redraw.push(cb)
    }
    return this
  }

  emit<E = 'redraw'>(eventName: E, ...args: any[]) {
    _.forEach(this.#cb[eventName] || [], (fn) => fn(...args))
  }
}

export default ListItem
