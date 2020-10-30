import _ from 'lodash'
import Component from './Component'
import {
  IComponent,
  IComponentConstructor,
  IListItemChildComponent,
  IListItemComponent,
  UIComponent,
} from './types'

class ListItemChildComponent
  extends Component
  implements IListItemChildComponent {
  #listId: string = ''
  #iteratorVar: string = ''

  constructor(...args: ConstructorParameters<IComponentConstructor>) {
    super(...args)
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

  set iteratorVar(iteratorVar) {
    this.#iteratorVar = iteratorVar
  }

  get isListConsumer() {
    return true
  }

  createChild(...args: Parameters<IComponent['createChild']>) {
    return super
      .createChild(new ListItemChildComponent(...args))
      ?.set('listId', this.listId)
      .set('iteratorVar', this.iteratorVar)
  }

  getDataObject() {
    let parent: UIComponent | null = super.parent()

    while (parent) {
      if (parent?.noodlType === 'listItem') {
        return (parent as IListItemComponent).getDataObject()
      }
    }
  }

  setDataObject<T>(data: T) {
    // this.#dataObject = data
  }
}

export default ListItemChildComponent
