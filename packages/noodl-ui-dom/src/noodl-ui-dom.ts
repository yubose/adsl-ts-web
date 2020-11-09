import Logger from 'logsnap'
import { getType, IComponentTypeInstance, NOODLComponentType } from 'noodl-ui'
import {
  componentEventMap,
  componentEventIds,
  componentEventTypes,
} from './constants'
import * as T from './types'

class NOODLUIDOM implements T.INOODLUiDOM {
  #callbacks: {
    all: Function[]
    component: Record<T.NOODLDOMComponentType, Function[]>
  } = {
    all: [],
    component: componentEventTypes.reduce(
      (acc, evt: T.NOODLDOMComponentType) => Object.assign(acc, { [evt]: [] }),
      {} as Record<T.NOODLDOMComponentType, Function[]>,
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
    container?: T.NOODLDOMElement | null,
  ) {
    const { noodlType } = component
    let node: T.NOODLDOMElement | null = null

    if (component) {
      if (noodlType === 'plugin') {
        // Don't create a node. Except just emit the events accordingly
        // This is to allow the caller to determine whether they want to create
        // a separate DOM node or not
        this.emit('create.component', null, component)
        this.emit('create.plugin', null, component)
      } else {
        node = document.createElement(getType(component))
        this.emit('create.component', node, component)
        if (node) {
          if (componentEventMap[noodlType as NOODLComponentType]) {
            this.emit(componentEventMap[noodlType], node, component)
          }
          const parent = container || document.body
          if (!parent.contains(node)) parent.appendChild(node)

          if (component.length) {
            component.children().forEach((child: IComponentTypeInstance) => {
              const childNode = this.parse(child, node)
              if (childNode) node?.appendChild(childNode)
              // if (child.length) {
              //   child.children().forEach((innerChild) => {
              //     this.parse(innerChild, childNode)
              //     if (innerChild.noodlType === 'listItem') {
              //       console.log('Found listItem', innerChild)
              //     }
              //   })
              // }
            })
          }
        }
      }
    }

    return node || null
  }

  /**
   * Registers a listener to the listeners list
   * @param { string } eventName - Name of the listener event
   * @param { function } callback - Callback to invoke when the event is emitted
   */
  on<CT extends NOODLComponentType>(
    eventName: T.NOODLDOMEvent,
    callback: (
      node: T.NOODLDOMElement | null,
      component: IComponentTypeInstance<CT>,
    ) => void,
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
  off<E extends T.NOODLDOMEvent>(
    eventName: E,
    callback: Parameters<T.INOODLUiDOM['off']>[1],
  ) {
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
  emit<E extends string = T.NOODLDOMEvent>(
    eventName: E,
    node: T.NOODLDOMElement | null,
    component: IComponentTypeInstance,
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
  getCallbacks(eventName: T.NOODLDOMEvent): Function[] | null {
    if (typeof eventName === 'string') {
      const callbacksMap = this.#callbacks
      if (eventName === 'create.component') return callbacksMap.all
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
    if (eventName === 'create.component') return 'all'
    const fn = (type: string) => componentEventMap[type] === eventName
    eventKey = componentEventTypes.find(fn)
    return eventKey || ''
  }
}

export default NOODLUIDOM
