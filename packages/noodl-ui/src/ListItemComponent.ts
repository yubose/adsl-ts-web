import _ from 'lodash'
import Component from './Component'
import {
  ComponentType,
  IComponent,
  IComponentConstructor,
  NOODLComponentType,
} from './types'

class ListItemComponent extends Component {
  #list: any[]

  constructor(...args: ConstructorParameters<IComponentConstructor>) {
    super(...args)
    this.#list = this.get('listObject') || []
  }

  addChild(child: ComponentType | NOODLComponentType) {
    let childComponent: IComponent
    let listItem: any
    if (_.isString(child)) {
      childComponent = super.addChild(child)
      if (child === 'listItem') {
        //
      }
    } else {
      if (child instanceof Component) {
        //
      } else {
        //
      }
    }
    return this
  }

  data() {
    return this.#list
  }

  iteratorVar() {
    return this.get('iteratorVar')
  }

  set(...args: Parameters<Component['set']>) {
    if (args[0] === 'listObject') this.#setData(args[1])
    super.set(...args)
    return this
  }
}

export default ListItemComponent
