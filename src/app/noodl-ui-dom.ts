import _ from 'lodash'
import { NOODLComponentProps, NOODLComponentType } from 'noodl-ui'
import { NOODLElement, NOODLDOMTagName } from 'app/types'
import * as T from 'app/types/domParserTypes'
import createElement from 'utils/createElement'
import Logger from './Logger'
import { noodlDomParserEvents } from '../constants'

const log = Logger.create('NOODLUIDOM.ts')

class NOODLUIDOM {
  #onCreateNode: {
    all: T.Parser[]
    component: Record<NOODLComponentType, T.Parser[]>
  } = {
    all: [],
    component: {
      button: [],
      divider: [],
      header: [],
      image: [],
      label: [],
      list: [],
      listItem: [],
      popUp: [],
      select: [],
      textField: [],
      view: [],
    },
  }
  // CREATEONCHANGEFACTORY IS EXPERIMENTAL AND WILL MOST LIKELY BE REMOVED
  #createOnChangeFactory: ((...args: any[]) => any) | undefined
  #cache: {
    record: { props: Map<any, any> }
    stub: { elements: { [key: string]: NOODLElement } }
  } = {
    record: { props: new Map() },
    stub: { elements: {} },
  }
  #handleChildren: (parentNode: NOODLElement, props: NOODLComponentProps) => any
  #listeners: Partial<Record<T.DOMParserEvent, Function[]>> = {}
  #parsers: T.Parser[] = []
  wrapper: ((node: NOODLElement) => NOODLElement) | undefined

  constructor() {
    this.#handleChildren = (
      parentNode: NOODLElement,
      children: string | number | NOODLComponentProps | NOODLComponentProps[],
    ) => {
      if (children) {
        if (_.isArray(children)) {
          _.forEach(children, (child) => {
            this.#handleChildren(parentNode, child)
          })
        } else if (_.isString(children) || _.isNumber(children)) {
          parentNode && (parentNode.innerHTML = `${children}`)
        } else if (_.isPlainObject(children)) {
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
   * Adds a parser to the list of parsers
   * @param { Parser } parser
   */
  add(parser: T.Parser) {
    this.#parsers.push(parser)
    return this
  }

  /**
   * Removes a parser from the list of parsers (uses strict === to find the reference)
   * @param { Parser } parser
   */
  remove(parser: T.Parser) {
    this.#parsers = _.filter(this.#parsers, (p) => p !== parser)
    return this
  }

  /**
   * Parses props and returns a DOM Node described by props. This also
   * resolves its children hieararchy until there are none left
   * @param { NOODLComponentProps } props
   */
  parse(props: NOODLComponentProps) {
    let node: NOODLElement | undefined

    if (props) {
      if (props.type) {
        node = createElement(props.type)
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
      if (_.isFunction(this.wrapper)) {
        node = this.wrapper(node as NOODLElement)
      }

      _.forEach(this.#parsers, (parseFn: T.Parser) => {
        parseFn(node as NOODLElement, props, this.getUtils())
      })

      if (props.children) {
        this.#handleChildren(node as NOODLElement, props.children as any)
      }

      // TODO: Isolate this into its own method
      if (node) {
        _.forEach(
          this.#onCreateNode.all,
          (fn) => fn && fn(node as NOODLElement, props),
        )
        _.forEach(
          this.#onCreateNode.component[props.noodlType],
          (fn) => fn && fn(node as NOODLElement, props),
        )
      }
    }

    return node
  }

  /**
   * Registers a listener to the listeners list
   * @param { string } eventName - Name of the listener event
   * @param { function } callback - Callback to invoke when the event is emitted
   */
  on(eventName: T.DOMParserEvent, callback: Function) {
    if (!_.isArray(this.#listeners[eventName])) {
      this.#listeners[eventName] = []
    }
    ;(this.#listeners[eventName] as Function[]).push(callback)
    console.groupCollapsed(
      `%c[noodl-ui-dom.ts] on -- Registered listener: ${eventName}`,
      'color:#828282',
    )
    console.trace()
    console.groupEnd()
    return this
  }

  /**
   * Removes a listener's callback from the listeners list
   * @param { string } eventName - Name of the listener event
   * @param { function } callback
   */
  off(eventName: T.DOMParserEvent, callback: Function) {
    if (_.isArray(this.#listeners[eventName])) {
      if ((this.#listeners[eventName] as Function[]).includes(callback)) {
        this.#listeners[eventName] = _.filter(
          this.#listeners[eventName],
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
  emit(eventName: T.DOMParserEvent, ...args: any[]) {
    if (_.isArray(this.#listeners[eventName])) {
      _.forEach(this.#listeners[eventName], (fn) => fn(...args))
    }
    return this
  }

  getEventListeners(eventName: T.DOMParserEvent) {
    return this.#listeners[eventName]
  }

  /**
   * Returns true if key can exist as a property or method on a DOM node of tagName
   * @param { string } tagName - HTML tag
   * @param { string } key - Property of a DOM node
   */
  isValidAttribute(tagName: NOODLDOMTagName, key: string) {
    if (key && tagName) {
      if (!this.#cache.stub.elements[tagName]) {
        this.#cache.stub.elements[tagName] = createElement(tagName)
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

    if (_.isString(type)) {
      cbType = type
      callback = cb
    } else if (_.isFunction(type)) {
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
