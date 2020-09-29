import { NOODLComponentProps, NOODLComponentType } from 'noodl-ui'
import { noodlDOMEvents } from './constants'
import * as T from './types'
import Logger from './Logger'

const log = Logger.create('NOODLUIDOM.ts')

class NOODLUIDOM implements T.INOODLUIDOM {
  #onCreateNode: {
    all: T.Parser[]
    component: Record<T.NOODLDOMComponentType, T.Parser[]>
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
  #cache: {
    record: { props: Map<any, any> }
    stub: { elements: { [key: string]: T.NOODLElement } }
  } = {
    record: { props: new Map() },
    stub: { elements: {} },
  }
  #handleChildren: (
    parentNode: T.NOODLElement,
    props: NOODLComponentProps,
  ) => any
  #listeners: Partial<Record<T.NOODLDOMCreateNodeEvent, Function[]>> = {}
  #parsers: T.Parser[] = []
  wrapper: ((node: T.NOODLElement) => T.NOODLElement) | undefined

  constructor() {
    this.#handleChildren = (
      parentNode: T.NOODLElement,
      children: string | number | NOODLComponentProps | NOODLComponentProps[],
    ) => {
      if (children) {
        if (Array.isArray(children)) {
          children.forEach((child) => {
            this.#handleChildren(parentNode, child)
          })
        } else if (
          typeof children === 'string' ||
          typeof children === 'number'
        ) {
          parentNode && (parentNode.innerHTML = `${children}`)
        } else if (children && typeof children === 'object') {
          const childNode = this.parse(children)
          if (childNode) {
            parentNode.appendChild(childNode)
          }
        } else {
          log.func('constructor')
          log.orange(
            `Found children that is not an array, string or number type. This will not be visible on the page`,
            { parentNode, noodluiChildren: children },
          )
        }
      }
    }
  }

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
    }

    if (node) {
      // Apply the custom wrapper if provided
      if (typeof this.wrapper === 'function') {
        node = this.wrapper(node as T.NOODLElement)
      }

      this.#parsers.forEach((parseFn: T.Parser) => {
        parseFn(node as T.NOODLElement, props, this.getUtils())
        // Call event listeners if any were registered
        if (
          props.noodlType &&
          noodlDOMEvents[props.noodlType as T.NOODLDOMComponentType]
        ) {
          this.emit(noodlDOMEvents[props.noodlType], node, props)
        }
      })

      // TODO: Isolate this into its own method
      if (node) {
        this.#onCreateNode.all.forEach(
          (fn) => fn && fn(node as T.NOODLElement, props),
        )
        this.#onCreateNode.component[props.noodlType].forEach(
          (fn: any) => fn && fn(node as T.NOODLElement, props),
        )
      }

      if (props.children) {
        this.#handleChildren(node as T.NOODLElement, props.children as any)
      }
    }

    return node || null
  }

  /**
   * Registers a listener to the listeners list
   * @param { string } eventName - Name of the listener event
   * @param { function } callback - Callback to invoke when the event is emitted
   */
  on(eventName: T.NOODLDOMCreateNodeEvent, callback: Function) {
    if (!Array.isArray(this.#listeners[eventName])) {
      this.#listeners[eventName] = []
    }
    ;(this.#listeners[eventName] as Function[]).push(callback)
    return this
  }

  /**
   * Removes a listener's callback from the listeners list
   * @param { string } eventName - Name of the listener event
   * @param { function } callback
   */
  off(eventName: T.NOODLDOMCreateNodeEvent, callback: Function) {
    if (Array.isArray(this.#listeners[eventName])) {
      if ((this.#listeners[eventName] as Function[]).includes(callback)) {
        this.#listeners[eventName] = this.#listeners[eventName]?.filter(
          (cb) => cb !== callback,
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
  emit(eventName: T.NOODLDOMCreateNodeEvent, ...args: any[]) {
    if (Array.isArray(this.#listeners[eventName])) {
      this.#listeners[eventName]?.forEach((fn) => fn(...args))
    }
    return this
  }

  getEventListeners(eventName: T.NOODLDOMCreateNodeEvent) {
    return this.#listeners[eventName] || []
  }

  /**
   * Returns true if key can exist as a property or method on a DOM node of tagName
   * @param { string } tagName - HTML tag
   * @param { string } key - Property of a DOM node
   */
  isValidAttribute(tagName: T.NOODLDOMTagName, key: string) {
    if (key && tagName) {
      if (!this.#cache.stub.elements[tagName]) {
        this.#cache.stub.elements[tagName] = document.createElement(tagName)
      }
      return key in this.#cache.stub.elements[tagName]
    }
    return false
  }

  getUtils() {
    return {
      parse: this.parse.bind(this),
    }
  }

  /**
   * Registers observers to hook into create node events. The "type" for components
   * refers to NOODL component types like "view"
   * @param { string } type - Type of reason (either 'all' or a NOODL component type
   * @param { function } cb - Callback to invoke
   */
  onCreateNode(type: 'all' | NOODLComponentType, cb: T.Parser) {
    let cbType: 'all' | NOODLComponentType | undefined
    let callback: T.Parser | undefined

    if (typeof type === 'string') {
      cbType = type
      callback = cb
    } else if (typeof type === 'function') {
      cbType = 'all'
      callback = type
    } else {
      // TODO
    }

    if (callback && cbType) {
      if (cbType == 'all') {
        this.#onCreateNode.all.push(callback)
      } else {
        if (this.#onCreateNode.component[cbType]) {
          this.#onCreateNode.component[cbType].push(callback)
        } else {
          // TODO
        }
      }
    } else {
      // TODO
    }

    return this
  }

  get createOnChangeFactory() {
    return this.#createOnChangeFactory
  }

  /** THIS IS A TEMP / EXPERIMENTAL METHOD AND WILL BE REMOVED.  */
  set createOnChangeFactory(fn: ((...args: any[]) => any) | undefined) {
    this.#createOnChangeFactory = fn
  }
}

export default NOODLUIDOM
