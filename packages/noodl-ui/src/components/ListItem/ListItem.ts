import _ from 'lodash'
import Component from '../Base'
import ListItemChildComponent from './ListItemChild'
import { IComponent, IComponentConstructor, IListItem } from '../../types'

class ListItem extends Component implements IListItem {
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
    if (key === 'listId') this['listId'] = value
    if (key === 'listIndex') this['listIndex'] = value
    super.set(...args)
    return this
  }

  createChild(...args: Parameters<IComponent['createChild']>) {
    const child = super.createChild(new ListItemChildComponent(...args))
    child?.set('listId', this.listId).set('iteratorVar', this.iteratorVar)
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
