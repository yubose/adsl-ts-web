import Component from '../Base'
import { IComponent, ComponentConstructor } from '../../types'
import createComponent from '../../utils/createComponent'

class ListItemChildComponent extends Component {
  #listId: string = ''
  #iteratorVar: string = ''

  constructor(...args: ConstructorParameters<ComponentConstructor>) {
    super(...args)
    this['listId'] = this.get('listId') as any
    this['iteratorVar'] = this.get('iteratorVar') as any
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

  createChild(...args: Parameters<IComponent['createChild']>) {
    const child = createComponent(...args) as any
    child?.set('listId', this.listId).set('iteratorVar', this.iteratorVar)
    return child
  }

  getDataObject() {
    let parent: Component | null = super.parent()

    while (parent) {
      if (parent?.noodlType === 'listItem') {
        return (parent as any).getDataObject()
      }
    }
  }

  updateDataObject<T>(data: T) {
    // this.#dataObject = data
  }
}

export default ListItemChildComponent
