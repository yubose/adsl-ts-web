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
    this['noodlType'] = 'listItem'
    this.setDataObject(this.get(this.iteratorVar))
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
      ...super.toJS(),
      children: _.map(this.#children, (child) => child.toJS()),
      dataObject: this.getDataObject(),
      listId: this.listId,
      listIndex: this.listIndex,
      iteratorVar: this.iteratorVar,
      style: this.style,
    }
  }
}

export default ListItem
