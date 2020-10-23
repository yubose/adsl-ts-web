import _ from 'lodash'
import Logger from 'logsnap'
import {
  IComponent,
  IListComponent,
  IListItemComponent,
  IComponentConstructor,
  NOODLComponent,
} from './types'
import Component from './Component'
import ListItemComponent from './ListItemComponent'

const log = Logger.create('ListComponent')

class ListComponent extends Component implements IListComponent {
  #data: any[] | null = null
  #blueprint: NOODLComponent
  #children: IListItemComponent[] = []

  constructor(...args: ConstructorParameters<IComponentConstructor>)
  constructor()
  constructor(...args: any | ConstructorParameters<IComponentConstructor>) {
    super(
      ...((args.length ? args : [{ type: 'list' }]) as ConstructorParameters<
        IComponentConstructor
      >),
    )
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
    return this.get('iteratorVar') || ''
  }

  get listObject() {
    return this.#data
  }

  get length() {
    return this.#children.length
  }

  exists(child: string | IListItemComponent) {
    return !!child && child instanceof ListItemComponent
      ? this.#children.includes(child)
      : !!this.find(child)
  }

  find(child: string | IListItemComponent) {
    const fn = _.isString(child)
      ? (c: IListItemComponent) => !!c.id && c.id === child
      : (c: IListItemComponent) => c === child
    return _.find(this.#children, fn)
  }

  getBlueprint() {
    return this.#blueprint
  }

  getData() {
    return this.#children.map((c) => c.get(this.iteratorVar))
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

  setDataObject(c: number | string | IListItemComponent, data: any) {
    const child = this.#getListItem(c)
    child?.set(this.iteratorVar, data)
    return this
  }

  #getListItem = (child: string | number | IListItemComponent) => {
    if (_.isNumber(child)) return this.#children[child]
    return this.find(child)
  }

  getListItemChildren() {
    return this.#children
  }

  createChild(...args: Parameters<IComponent['createChild']>) {
    const child = super.createChild(...args)
    if (child?.noodlType === 'listItem') {
      this.#children.push(child)
    }
    return child
  }

  removeChild(...args: Parameters<IComponent['removeChild']>) {
    const removedChild = super.removeChild(...args)
    if (removedChild && this.#children.includes(removedChild)) {
      this.#children = this.#children.filter((c) => c !== removedChild)
    }
    return removedChild
  }

  set(key: 'listObject', value: any[]): this
  set(key: 'blueprint', value: any): this
  set(...args: Parameters<IComponent['set']>) {
    const [key, value] = args

    if (key === 'listObject') {
      // Refresh holdings of the list item data / children
      this.#data = args[1]
    } else if (key === 'blueprint') {
      this.#blueprint = value
      return this
    }
    super.set(...args)
    return this
  }
}

export default ListComponent
