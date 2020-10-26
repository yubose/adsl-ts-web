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
  #children: IComponent[] = []

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
        child.setData(listObject)
        this.createChild(child)
      }
    }
  }

  get iteratorVar() {
    return this.get('iteratorVar')
  }

  get length() {
    return this.#children.length
  }

  getBlueprint() {
    return this.#blueprint
  }

  getData() {
    return this.#data
  }

  getDataObject(index: number): any
  getDataObject(childId: string | number): any
  getDataObject(child: IComponent): any
  getDataObject(child: number | string | IComponent) {
    let _inst: IComponent | undefined
    // Child component id
    if (_.isString(child)) {
      _inst = _.find(this.#children, (c) => c.id == child)
    } else if (_.isNumber(child)) {
      // Child index
      _inst = this.#children[child]
    } else if (child instanceof Component) {
      _inst = child
    }
    return _inst && _inst.get(this.iteratorVar)
  }

  addChild(child: IComponent) {
    if (child instanceof Component) this.#children.push(child)
    return this
  }

  removeChild(...args: Parameters<IComponent['removeChild']>) {
    const removedChild = super.removeChild(...args)
    if (this.hasChild(removedChild)) {
      this.#children = this.#children.filter((c) => c !== removedChild)
    }
    return removedChild
  }

  

  createChild(child: ComponentType | NOODLComponentType) {
    let childComponent: IComponent = super.createChild(child)
    if (childComponent.noodlType === 'listItem') {
      if (!this.has(childComponent)) this.add(childComponent)
    }
    return childComponent
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
