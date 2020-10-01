import Logger from 'logsnap'
import { NOODLComponentProps } from 'noodl-ui'
import { composeForEachFns } from './utils'
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
  // CREATEONCHANGEFACTORY IS EXPERIMENTAL AND WILL MOST LIKELY BE REMOVED
  #createOnChangeFactory: ((...args: any[]) => any) | undefined
  #parsers: T.NodePropsFunc[] = []
  #stub: { elements: { [key: string]: T.NOODLDOMElement } } = { elements: {} }

  /**
   * Parses props and returns a DOM Node described by props. This also
   * resolves its children hieararchy until there are none left
   * @param { NOODLComponentProps } props
   */
  parse<Props extends NOODLComponentProps>(props: Props) {
    let node: T.NOODLDOMElement | undefined
    let { type = '', noodlType = '' } = props

    if (props) {
      if (type) node = document.createElement(type)
    } else {
      log.func('parse')
      log.red(
        `Could not create a DOM node because the props given was null or undefined`,
        props,
      )
      return null
    }

    if (node) {
      const forEachFns = composeForEachFns(
        this.#runParsers,
        this.#recurseChildren,
      )
      forEachFns(node, props)
      if (componentEventMap[noodlType]) {
        this.emit(componentEventMap[noodlType], node, props)
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
    // console.log(this.#callbacks)
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
  emit(eventName: T.NOODLDOMEvent, ...args: T.NodePropsFuncArgs) {
    const callbacks = this.getCallbacks(eventName)
    if (Array.isArray(callbacks)) {
      callbacks.forEach((fn: T.NodePropsFunc) => fn && fn(...args))
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

  get createOnChangeFactory() {
    return this.#createOnChangeFactory
  }

  /** THIS IS A TEMP / EXPERIMENTAL METHOD AND WILL BE REMOVED.  */
  set createOnChangeFactory(fn: ((...args: any[]) => any) | undefined) {
    this.#createOnChangeFactory = fn
  }

  /**
   * Runs all parsers currently registered
   * @param { NOODLDOMElement } node
   */
  #runParsers = (node: T.NOODLDOMElement, props: NOODLComponentProps) => {
    this.#parsers.forEach((parseFn) => parseFn(node, props))
    return this
  }

  #recurseChildren = (
    node: T.NOODLDOMElement,
    { children }: NOODLComponentProps,
  ) => {
    if (children) {
      if (Array.isArray(children)) {
        children.forEach((child) => {
          this.#recurseChildren(node, child)
        })
      } else if (typeof children === 'string' || typeof children === 'number') {
        if (node) node.innerHTML = `${children}`
      } else if (children && typeof children === 'object') {
        const childNode = this.parse(children)
        if (childNode) node.appendChild(childNode)
      } else {
        log.func('#recurseChildren')
        log.orange(
          `Found children that is not an array, string or number type. This ` +
            `most likely means that it was inteded to be excluded which somehow ended up here.`,
          { node, children },
        )
      }
    }
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
