import _ from 'lodash'
import { NOODLComponentProps } from 'noodl-ui'
import createElement from 'utils/createElement'
import { DOMNode, Parser } from 'app/types'

class NOODLDOMParser {
  #cache: {
    record: { props: Map<any, any> }
    stub: { elements: { [key: string]: DOMNode } }
  } = {
    record: { props: new Map() },
    stub: { elements: {} },
  }
  #parsers: Parser[] = []
  wrapper: ((node: DOMNode) => DOMNode) | undefined

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

    if (props.type) {
      node = createElement(props.type)
    }

    if (node) {
      // Apply the custom wrapper if provided
      if (_.isFunction(this.wrapper)) {
        node = this.wrapper(node as DOMNode)
      }

      _.forEach(this.#parsers, (parseFn: Parser) => {
        parseFn(node as DOMNode, props)

        if (props.children) {
          const { children } = props

          if (_.isArray(children)) {
            _.forEach(children, (child) => {
              const childNode = this.parse(child as NOODLComponentProps)
              if (childNode) {
                node?.appendChild(childNode)
              }
            })
          } else if (_.isString(children) || _.isNumber(children)) {
            node && (node.innerHTML += `${children}`)
          } else if (_.isPlainObject(children)) {
            this.parse(children)
          } else {
            const logMsg =
              `%c[NOODLDOMParser.ts][parse] ` +
              `Found children that is not an array, string or number type. This will not be visible on the page`
            console.log(logMsg, `color:#FF5722;font-weight:bold;`, {
              node,
              props,
            })
          }
        }
      })
    }

    return node
  }

  /**
   * Returns true if key can exist as a property or method on a DOM node of tagName
   * @param { string } tagName - HTML tag
   * @param { string } key - Property of a DOM node
   */
  isValidAttribute(tagName: string, key: string) {
    if (key && tagName) {
      if (!this.#cache.stub.elements[tagName]) {
        this.#cache.stub.elements[tagName] = createElement(
          tagName as keyof HTMLElementTagNameMap,
        )
      }
      return key in this.#cache.stub.elements[tagName]
    }
    return false
  }
}

export default NOODLDOMParser
