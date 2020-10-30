import _ from 'lodash'
import Component from './Component'
import ListItemChildComponent from './ListItemChildComponent'
import { IComponent, IComponentConstructor, IListItemComponent } from './types'

class ListItemComponent extends Component implements IListItemComponent {
  #dataObject: any
  #listId: string = ''
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
    this['listId'] = super.get('listId') || ''
    this['iteratorVar'] = super.get('iteratorVar') || ''
    this['noodlType'] = 'listItem'
  }

  get listId() {
    return this.#listId
  }

  set listId(listId) {
    this.#listId = listId
  }

  get iteratorVar() {
    return this.#iteratorVar
  }

  set iteratorVar(iteratorVar: string) {
    this.#iteratorVar = iteratorVar
  }

  createChild(...args: Parameters<IComponent['createChild']>) {
    return super
      .createChild(new ListItemChildComponent(...args))
      ?.set('listId', this.listId)
      .set('iteratorVar', this.iteratorVar)
  }

  getDataObject() {
    return this.#dataObject
  }

  setDataObject<T>(data: T) {
    this.#dataObject = data
  }
}

export default ListItemComponent
