import _ from 'lodash'
import Component from '../Base'
import {
  IComponent,
  IComponentConstructor,
  IComponentTypeInstance,
  IListItem,
  NOODLComponentType,
} from '../../types'
import { getDataObjectValue } from '../../utils/noodl'

class ListItem<K extends NOODLComponentType = 'listItem'>
  extends Component
  implements IListItem<K> {
  #children: any[] = []
  #dataObject: any
  #listId: string = ''
  #listIndex: null | number = null
  #iteratorVar: string = ''
  #cb = { redraw: [] }
  values: { [dataKey: string]: any }

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
  }

  child(index?: number) {
    if (!arguments.length) return this.#children[0]
    return _.isNumber(index) ? this.#children[index] : undefined
  }

  children() {
    return this.#children
  }

  get length() {
    return this.#children.length
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
    else super.set(...args)
    return this
  }

  createChild<C extends IComponentTypeInstance>(child: C): C {
    child?.setParent?.(this)
    child.set('listId', this.listId)
    child.set('listIndex', this.listIndex)
    this.#children.push(child)
    return child
  }

  hasChild<C extends IComponentTypeInstance>(child: C) {
    return this.#children.includes(child)
  }

  removeChild<C extends IComponentTypeInstance>(child: C) {
    if (child) {
      const index = this.#children.indexOf(child)
      if (index > -1) return this.#children.splice(index, 1)[0]
    }
  }

  getDataObject() {
    return this.#dataObject
  }

  setDataObject<T>(data: T) {
    this.#dataObject = data
    return this
  }

  toJS() {
    return {
      children: _.map(this.#children, (child) => child.toJS?.()),
      dataObject: this.getDataObject(),
      listId: this.listId,
      listIndex: this.listIndex,
      id: this.id,
      iteratorVar: this.iteratorVar,
      noodlType: this.noodlType,
      style: this.style,
      type: this.type,
    }
  }

  on<E extends 'redraw'>(eventName: E, cb: Function) {
    if (eventName === 'redraw') {
      // Restricting redraw to one handler only
      // if (this.#cb.redraw.length) return
      if (!this.#cb.redraw) this.#cb.redraw = []
      this.#cb.redraw.push(cb)
    } else if (eventName) {
      this.#cb[eventName] = Array.isArray(this.#cb[eventName])
        ? [...this.#cb[eventName], cb]
        : [cb]
    }
    return this
  }

  clearCbs() {
    Object.keys(this.#cb).forEach((name) => {
      if (Array.isArray(this.#cb[name])) {
        this.#cb[name].length = 0
      }
    })
    return this
  }

  emit<E = 'redraw'>(eventName: E, ...args: any[]) {
    _.forEach(this.#cb[eventName] || [], (fn) => fn(...args))
  }

  redraw(
    patch: { type: 'data-object' | 'key-value'; key?: string; value?: any },
    cb: (opts: {
      child: IComponentTypeInstance
      dataKey: string
      dataValue: any
    }) => void,
  ) {
    this.broadcast((child) => {
      if (patch.type === 'data-object') {
        let dataKey = child.get('dataKey') || ''
        let dataObject = patch.value || this.getDataObject()
        let dataValue

        if (child.has('dataKey')) {
          if (dataKey.startsWith(this.iteratorVar)) {
            dataValue = getDataObjectValue({
              dataKey,
              dataObject,
              iteratorVar: this.iteratorVar,
            })
          } else {
            dataValue = _.get(dataObject, dataKey)
          }
        }

        cb({ child, dataKey, dataObject, dataValue })
      }
    })
    return this
  }
}

export default ListItem
