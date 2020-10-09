import Logger from 'logsnap'
import { NOODLComponentProps } from 'noodl-ui'
import {
  componentEventMap,
  componentEventIds,
  componentEventTypes,
} from './constants'
import * as T from './types'

const log = Logger.create('NOODLUIDOM.ts')

class NOODLUIDOM implements T.INOODLUIDOM {
  #callbacks: {
    all: T.NodePropsFunc[]
    component: Record<T.NOODLDOMComponentType, T.NodePropsFunc[]>
  } = {
    all: [],
    component: componentEventTypes.reduce(
      (acc, evt: T.NOODLDOMComponentType) => Object.assign(acc, { [evt]: [] }),
      {} as Record<T.NOODLDOMComponentType, T.NodePropsFunc[]>,
    ),
  }
  #stub: { elements: { [key: string]: T.NOODLDOMElement } } = { elements: {} }

  constructor({ log }: { log?: { enabled?: boolean } } = {}) {
    Logger[log?.enabled ? 'enable' : 'disable']?.()
  }

  /**
   * Parses props and returns a DOM Node described by props. This also
   * resolves its children hieararchy until there are none left
   * @param { NOODLComponentProps } props
   */
  parse(props: NOODLComponentProps | null, container?: any) {
    let node: T.NOODLDOMElement | undefined

    if (props) {
      let { type = '', noodlType = '' } = props

      if (props) {
        if (type) {
          if (noodlType === 'plugin') {
            // Don't create a node. Except just emit the events accordingly
            // This is to allow the caller to determine whether they want to create
            // a separate DOM node or not
            this.emit('all', null, props)
            this.emit('create.plugin', null, props)
          } else {
            node = document.createElement(type)
          }
        }
      } else {
        log.func('parse')
        log.red(
          `Could not create a DOM node because the props given was null or undefined`,
          props,
        )
        return null
      }

      if (node) {
        this.emit('all', node, props)
        if (componentEventMap[noodlType]) {
          this.emit(componentEventMap[noodlType], node, props)
        }

        const parent = container || document.body
        if (!parent.contains(node)) parent.appendChild(node)

        if (Array.isArray(props.children)) {
          const fn = (child: NOODLComponentProps) => this.parse(child, node)
          props.children.forEach(fn)
        } else if (
          typeof props.children === 'string' ||
          typeof props.children === 'number'
        ) {
          node.innerHTML = `${props.children}`
        } else if (props.children && typeof props.children === 'object') {
          const childNode = this.parse(props.children)
          if (childNode) node.appendChild(childNode)
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
  on(eventName: T.NOODLDOMEvent, callback: T.NodePropsFunc) {
    const callbacks = this.getCallbacks(eventName)
    if (Array.isArray(callbacks)) callbacks.push(callback)
    return this
  }

  /**
   * Removes a listener's callback from the listeners list
   * @param { string } eventName - Name of the listener event
   * @param { function } callback
   */
  off(eventName: T.NOODLDOMEvent, callback: T.NodePropsFunc) {
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
  emit(
    eventName: T.NOODLDOMEvent,
    node: T.NOODLDOMElement | null,
    props: NOODLComponentProps,
  ) {
    const callbacks = this.getCallbacks(eventName)
    if (Array.isArray(callbacks)) {
      callbacks.forEach(
        (fn: T.NodePropsFunc) => fn && fn(node as T.NOODLDOMElement, props),
      )
    }
    return this
  }

  /**
   * Takes either a component type or any other name of an event and returns the
   * callbacks associated with it
   * @param { string } value - Component type or name of the event
   */
  getCallbacks(eventName: T.NOODLDOMEvent): T.NodePropsFunc[] | null {
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
