import _ from 'lodash'
import Component from './Component'
import { IComponent, IComponentConstructor } from './types'

class ListComponent extends Component {
  constructor(...args: ConstructorParameters<IComponentConstructor>) {
    super(args)
  }

  createChild(...args: Parameters<Component['createChild']>) {
    const child = super.createChild(...args)
    const dataApples = [
      { type: 'abc', text: 'hello' },
      { type: 'fawfwabfawfwac', text: 'hellfafawo' },
    ]

    const iteratorVar = child.get('iteratorVar')

    Object.defineProperty(child, iteratorVar, {
      value: function () {
        return dataApples
      },
    })

    return this
  }

  getList() {
    return this.get('list')
  }
}

export default ListComponent
