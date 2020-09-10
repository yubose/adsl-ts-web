import _ from 'lodash'
import { NOODLComponentProps } from 'noodl-ui'
import { DOMNode, NOODLDOMTagName, Parser } from 'app/types'
import createElement from 'utils/createElement'
import createLogger from 'utils/log'

const log = createLogger('NOODLDOMParser.ts')

class NOODLDOMParser {
  #cache: {
    record: { props: Map<any, any> }
    stub: { elements: { [key: string]: DOMNode } }
  } = {
    record: { props: new Map() },
    stub: { elements: {} },
  }
  #handleChildren: (parentNode: DOMNode, props: NOODLComponentProps) => any
  #parsers: Parser[] = []
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
  add(parser: Parser) {
    this.#parsers.push(parser)
    return this
  }

  /**
   * Removes a parser from the list of parsers (uses strict === to find the reference)
   * @param { Parser } parser
   */
  remove(parser: Parser) {
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

      _.forEach(this.#parsers, (parseFn: Parser) => {
        parseFn(node as DOMNode, props, this.getUtils())
      })

      if (props.children) {
        this.#handleChildren(node as DOMNode, props.children as any)
      }
    }

    return node
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
