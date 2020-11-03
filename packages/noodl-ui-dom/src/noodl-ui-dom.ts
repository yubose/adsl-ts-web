import Logger from 'logsnap'
import { IComponentTypeInstance, IList, NOODLComponentType } from 'noodl-ui'
import {
  componentEventMap,
  componentEventIds,
  componentEventTypes,
} from './constants'
import NOODLDOMBaseComponent from './components/base'
import NOODLDOMList from './components/list'
import * as T from './types'

class NOODLUIDOM implements T.INOODLUiDOM {
  #callbacks: {
    all: T.NOODLDOMNodeCreationCallback[]
    component: Record<T.NOODLDOMComponentType, T.NOODLDOMNodeCreationCallback[]>
  } = {
    all: [],
    component: componentEventTypes.reduce(
      (acc, evt: T.NOODLDOMComponentType) => Object.assign(acc, { [evt]: [] }),
      {} as Record<T.NOODLDOMComponentType, T.NOODLDOMNodeCreationCallback[]>,
    ),
  }
  #stub: { elements: { [key: string]: T.NOODLDOMElement } } = { elements: {} }

  constructor({ log }: { log?: { enabled?: boolean } } = {}) {
    Logger[log?.enabled ? 'enable' : 'disable']?.()
  }

  /**
   * Parses props and returns a DOM Node described by props. This also
   * resolves its children hieararchy until there are none left
   * @param { IComponentTypeInstance } props
   */
  parse<C extends IComponentTypeInstance>(
    component: C,
    container?: HTMLElement | null,
  ) {
    let node: T.NOODLDOMElement | null = null
    let noodluidomComponent: any

    if (component) {
      const { type = '', noodlType = '' } = component.get(['type', 'noodlType'])

      if (type) {
        if (noodlType === 'plugin') {
          noodluidomComponent = new NOODLDOMBaseComponent(null, component)
          // Don't create a node. Except just emit the events accordingly
          // This is to allow the caller to determine whether they want to create
          // a separate DOM node or not
          this.emit('all', null, noodluidomComponent)
          this.emit('create.plugin', null, noodluidomComponent)
        } else {
          console.info(type)
          node = document.createElement(type)

          switch (noodlType as NOODLComponentType) {
            case 'br':
            case 'button':
            case 'date':
            case 'dateSelect':
            case 'divider':
            case 'footer':
            case 'header':
            case 'image':
            case 'label':
              noodluidomComponent = new NOODLDOMBaseComponent(node, component)
              break
            case 'list':
              noodluidomComponent = new NOODLDOMList(node, component as IList)
              break
            case 'listItem':
            case 'plugin':
            case 'popUp':
            case 'searchBar':
            case 'select':
            case 'scrollView':
            case 'textField':
            case 'textView':
            case 'video':
            case 'view':
            default:
              noodluidomComponent = new NOODLDOMBaseComponent(node, component)
              break
          }
        }
      }

      if (node) {
        this.emit('all', noodluidomComponent.node, noodluidomComponent)
        if (componentEventMap[noodlType as NOODLComponentType]) {
          this.emit(
            componentEventMap[noodlType],
            noodluidomComponent.node,
            noodluidomComponent,
          )
        }
        const parent = container || document.body
        if (!parent.contains(noodluidomComponent.node))
          parent.appendChild(noodluidomComponent.node)

        component.children()?.forEach((child: IComponentTypeInstance) => {
          const childNode = this.parse(child, noodluidomComponent.node)
          if (childNode) noodluidomComponent.node?.appendChild(childNode)
          if (child.length) {
            child.children().forEach((innerChild) => {
              const innerChildNode = this.parse(innerChild, childNode)
              console.log(innerChildNode)
            })
          }
        })
      }
    }

    return node || null
  }

  /**
   * Registers a listener to the listeners list
   * @param { string } eventName - Name of the listener event
   * @param { function } callback - Callback to invoke when the event is emitted
   */
  on<E extends T.NOODLDOMEvent = 'create.list'>(
    eventName: E,
    callback: T.NOODLDOMNodeCreationCallback<T.NOODLDOMElement, IList>,
  ): this
  on<E extends T.NOODLDOMEvent>(
    eventName: E,
    callback: T.NOODLDOMNodeCreationCallback,
  ) {
    const callbacks = this.getCallbacks(eventName)
    if (Array.isArray(callbacks)) callbacks.push(callback)
    return this
  }

  /**
   * Removes a listener's callback from the listeners list
   * @param { string } eventName - Name of the listener event
   * @param { function } callback
   */
  off(eventName: T.NOODLDOMEvent, callback: T.NOODLDOMNodeCreationCallback) {
    const callbacks = this.getCallbacks(eventName)
    if (Array.isArray(callbacks)) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) callbacks.splice(index, 1)
    }
    return this
  }

  /**
   * Emits an event name and calls all the callbacks registered to that event
   * @param { string } eventName - Name of the listener event
   * @param { ...any[] } args
   */
  emit<E extends string = 'create.plugin'>(
    eventName: E,
    node: null,
    noodluidomComponent: T.INOODLDOMComponent<any>,
  ): this
  emit<E extends string = T.NOODLDOMEvent>(
    eventName: E,
    node: T.NOODLDOMElement | null,
    component: T.INOODLDOMComponent<any>,
  ) {
    const callbacks = this.getCallbacks(eventName as T.NOODLDOMEvent)
    if (Array.isArray(callbacks)) {
      callbacks.forEach((fn) => fn && fn(node as T.NOODLDOMElement, component))
    }
    return this
  }

  /**
   * Takes either a component type or any other name of an event and returns the
   * callbacks associated with it
   * @param { string } value - Component type or name of the event
   */
  getCallbacks(
    eventName: T.NOODLDOMEvent,
  ): T.NOODLDOMNodeCreationCallback[] | null {
    if (typeof eventName === 'string') {
      const callbacksMap = this.#callbacks
      if (eventName === 'all') return callbacksMap.all
      if (componentEventIds.includes(eventName)) {
        return callbacksMap.component[this.#getEventKey(eventName)]
      }
    }
    return null
  }

  /**
   * Returns true if key can exist as a property or method on a DOM node of tagName
   * @param { string } tagName - HTML tag
   * @param { string } key - Property of a DOM node
   */
  isValidAttr(tagName: T.NOODLDOMElementTypes, key: string) {
    if (key && tagName) {
      if (!this.#stub.elements[tagName]) {
        this.#stub.elements[tagName] = document.createElement(tagName)
      }
      return key in this.#stub.elements[tagName]
    }
    return false
  }

  /**
   * Takes an event name like "on.create" and returns the direct parent key
   * @param { string } eventName - Name of an event
   */
  #getEventKey = (eventName: T.NOODLDOMEvent) => {
    // TODO - Add more cases
    let eventKey: string | undefined
    if (eventName === 'all') return 'all'
    const fn = (type: string) => componentEventMap[type] === eventName
    eventKey = componentEventTypes.find(fn)
    return eventKey || ''
  }
}

export default NOODLUIDOM
