import _ from 'lodash'
import Logger from 'logsnap'
import {
  ComponentType,
  IComponent,
  IComponentConstructor,
  NOODLComponent,
  NOODLComponentType,
} from './types'
import Component from './Component'
import ListItemComponent from './ListItemComponent'

const log = Logger.create('ListComponent')

class ListComponent extends Component {
  #data: any[]
  #blueprint: NOODLComponent
  #children: Map<IComponent, IComponent> = new Map()

  constructor(...args: ConstructorParameters<IComponentConstructor>)
  constructor()
  constructor(...args: any | ConstructorParameters<IComponentConstructor>) {
    super(
      ...((args.length ? args : [{ type: 'list' }]) as ConstructorParameters<
        IComponentConstructor
      >),
    )
    this.#data = this.get('listObject') || []
    // TODO - set blueprint
    const listObject = this.get('listObject')
    const iteratorVar = this.get('iteratorVar')

    if (listObject) {
      if (_.isArray(listObject)) {
        _.forEach(listObject, (dataObject) => {
          const child = new ListItemComponent({ iteratorVar })
          child.set(iteratorVar, dataObject)
          this.createChild(child)
        })
      } else {
        const child = new ListItemComponent({ iteratorVar })
        child.setData(iteratorVar, listObject)
        this.createChild(child)
      }
    }
  }

  get iteratorVar() {
    return this.get('iteratorVar')
  }

  blueprint() {
    return this.#blueprint
  }

  data() {
    return this.#data
  }

  addListItem(component: IComponent): IComponent
  addListItem(item: any): IComponent
  addListItem(item: any) {
    let data: any
    if (item instanceof Component) {
      data = item.get(this.iteratorVar)
    } else {
      data = item
    }
    this.#data.push(data)
    return this.createChild(this.blueprint).set(this.iteratorVar, data)
  }

  createChild(child: ComponentType | NOODLComponentType) {
    let childComponent: IComponent = super.createChild(child)
    if (childComponent.noodlType === 'listItem') {
      if (!this.#children.has(childComponent)) {
        this.#children.set(childComponent, childComponent)
      }
    }
    return childComponent
  }

  removeChild(child: IComponent) {
    const removedChild = super.removeChild(child)
    if (this.#children.has(child)) {
      this.#children.delete(child)
      return child
    }
    return removedChild
  }

  set(...args: Parameters<Component['set']>) {
    const [key, value] = args

    if (key === 'listObject') {
      // Refresh holdings of the list item data / children
      this.#data = args[1]
      const queue = [...this.#data]
      this.#children.forEach((child) => {
        if (queue.length) {
          child.set(this.iteratorVar, queue.shift())
        } else {
          this.#children.delete(child)
          log.func('set')
          log.red(
            `Removed a listItem from the list because there was no data object ` +
              `available to be assigned`,
            { child, children: this.#children, data: this.#data },
          )
        }
      })
    } else if (key === 'blueprint') {
      this.#blueprint = value
    }
    super.set(...args)
    return this
  }
}

export default ListComponent
