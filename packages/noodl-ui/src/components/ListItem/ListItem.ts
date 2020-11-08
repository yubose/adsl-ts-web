import _ from 'lodash'
import Component from '../Base'
import ListItemChildComponent from './ListItemChild'
import {
  IComponent,
  IComponentConstructor,
  IComponentTypeInstance,
  IListItem,
  NOODLComponentType,
} from '../../types'
import createChild from '../../utils/createChild'

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
    console.log(this.iteratorVar)
    console.log(this.get(this.iteratorVar))
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
    super.set(...args)
    return this
  }

  createChild<C extends IComponentTypeInstance>(child: C): C {
    child
      ?.setParent(this)
      .set('listId', this.listId)
      .set('iteratorVar', this.iteratorVar)
    this.#children.push(child)
    const blueprint = this.parent()?.blueprint
    console.log('BLUEPRINT', blueprint)
    return child
  }

  getDataObject() {
    return this.#dataObject
  }

  setDataObject<T>(data: T) {
    this.#dataObject = data
    return this
  }
}

export default ListItem
