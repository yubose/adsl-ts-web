import Logger from 'logsnap'
import { NOODLComponentProps } from 'noodl-ui'
import { noodlDOMEvents } from './constants'
import { composeForEachFns } from './utils'
import * as T from './types'

const log = Logger.create('NOODLUIDOM.ts')

class NOODLUIDOM implements T.INOODLUIDOM {
  #callbacks: {
    all: T.OnCreateNode[]
    component: Record<T.NOODLDOMComponentType, T.OnCreateNode[]>
  } = {
    all: [],
    component: {
      button: [],
      divider: [],
      footer: [],
      header: [],
      image: [],
      label: [],
      list: [],
      listItem: [],
      popUp: [],
      select: [],
      textField: [],
      video: [],
      view: [],
    },
  }
  // CREATEONCHANGEFACTORY IS EXPERIMENTAL AND WILL MOST LIKELY BE REMOVED
  #createOnChangeFactory: ((...args: any[]) => any) | undefined
  #parsers: T.OnCreateNode[] = []
  #stub: { elements: { [key: string]: T.NOODLElement } } = { elements: {} }

  /**
   * Parses props and returns a DOM Node described by props. This also
   * resolves its children hieararchy until there are none left
   * @param { NOODLComponentProps } props
   */
  parse<Props extends NOODLComponentProps>(props: Props) {
    let node: T.NOODLElement | undefined

    if (props) {
      if (props.type) {
        node = document.createElement(props.type)
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
      composeForEachFns(
        this.#runParsers,
        this.#runCallbacks,
        // this.#recurseChildren,
      )(node, props)
    }

    return node || null
  }

  /**
   * Registers a listener to the listeners list
   * @param { string } eventName - Name of the listener event
   * @param { function } callback - Callback to invoke when the event is emitted
   */
  on(eventName: T.NOODLDOMCreateNodeEvent, callback: T.OnCreateNode) {
    const callbacks = this.#callbacks
    if (!Array.isArray(callbacks[eventName])) callbacks[eventName] = []
    callbacks[eventName].push(callback)
    return this
  }

  /**
   * Removes a listener's callback from the listeners list
   * @param { string } eventName - Name of the listener event
   * @param { function } callback
   */
  off(eventName: T.NOODLDOMCreateNodeEvent, callback: T.OnCreateNode) {
    if (Array.isArray(this.#callbacks[eventName])) {
      const callbacks = this.#callbacks
      if (callbacks[eventName].includes(callback)) {
        callbacks[eventName] = callbacks[eventName].filter(
          (cb: T.OnCreateNode) => cb !== callback,
        )
      }
    }
    return this
  }

  /**
   * Emits an event name and calls all the callbacks registered to that event
   * @param { string } eventName - Name of the listener event
   * @param { ...any[] } args
   */
  emit(eventName: T.NOODLDOMCreateNodeEvent, ...args: T.OnCreateNodeArgs) {
    if (Array.isArray(this.#callbacks[eventName])) {
      const callFn = (fn: T.OnCreateNode) => fn && fn(...args)
      this.#callbacks[eventName].forEach(callFn)
    }
    return this
  }

  getListeners(eventName: T.NOODLDOMCreateNodeEvent) {
    return this.#callbacks[eventName] || []
  }

  /**
   * Returns true if key can exist as a property or method on a DOM node of tagName
   * @param { string } tagName - HTML tag
   * @param { string } key - Property of a DOM node
   */
  isValidAttr(tagName: T.NOODLDOMTagName, key: string) {
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
   * @param { NOODLElement } node
   */
  #runParsers = (node: T.NOODLElement, props: NOODLComponentProps) => {
    this.#parsers.forEach((parseFn) => parseFn(node, props))
    this.emit(noodlDOMEvents[props.noodlType], node, props)
    return this
  }

  /**
   * Runs registered callbacks related to this context
   * @param { NOODLElement } node
   */
  #runCallbacks = (node: T.NOODLElement, props: NOODLComponentProps) => {
    const callbacks = this.#callbacks
    const callFn = (cb: T.OnCreateNode) => cb && cb(node, props)
    callbacks.all.forEach(callFn)
    callbacks.component[props.noodlType] || [].forEach((fn) => callFn(fn))
    return this
  }

  #recurseChildren = (node: T.NOODLElement, props: NOODLComponentProps) => {
    if (props.children) {
      const { children } = props
      if (Array.isArray(children)) {
        children.forEach((child) => {
          this.#recurseChildren(node, child)
        })
      } else if (typeof children === 'string' || typeof children === 'number') {
        node && (node.innerHTML = `${children}`)
      } else if (children && typeof children === 'object') {
        const childNode = this.parse(children)
        childNode && node.appendChild(childNode)
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
}

export default NOODLUIDOM
