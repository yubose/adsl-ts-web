import _ from 'lodash'
import { NOODLComponentProps } from 'noodl-ui'
import { DOMNode, NOODLDOMTagName } from 'app/types'
import * as T from 'app/types/domParserTypes'
import createElement from 'utils/createElement'
import Logger from './Logger'
import { noodlDomParserEvents } from '../constants'

const log = Logger.create('NOODLDOMParser.ts')

class NOODLDOMParser {
  #cache: {
    record: { props: Map<any, any> }
    stub: { elements: { [key: string]: DOMNode } }
  } = {
    record: { props: new Map() },
    stub: { elements: {} },
  }
  #handleChildren: (parentNode: DOMNode, props: NOODLComponentProps) => any
  #listeners: Partial<Record<T.DOMParserEvent, Function[]>> = {}
  #parsers: T.Parser[] = []
  wrapper: ((node: DOMNode) => DOMNode) | undefined

  constructor() {
    this.#handleChildren = (
      parentNode: DOMNode,
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
    let node: DOMNode | undefined

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
        node = this.wrapper(node as DOMNode)
      }

      _.forEach(this.#parsers, (parseFn: T.Parser) => {
        parseFn(node as DOMNode, props, this.getUtils())
      })

      if (props.children) {
        this.#handleChildren(node as DOMNode, props.children as any)
      }

      this.emit(noodlDomParserEvents.onCreateNode, node, props)
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
    log.func('on').grey(`Registered listener: ${eventName}`, callback)
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
}

export default NOODLDOMParser
