import _ from 'lodash'
import { NOODLComponentProps } from 'noodl-ui'
import { DOMNode, Parser } from 'app/types'
import composeParsers from 'utils/composeParsers'

export interface ParserOptions {
  toDOMNode?: (props: NOODLComponentProps) => typeof HTMLElement
}

function createParser(...parsers: Parser[]) {
  // Last position in args is reserved for options.
  // TODO: Figure out how to do typing on that

  const options = parsers[parsers.length - 1] as CreateParserOptions
  parsers = parsers.slice(0, parsers.length - 1)

  const _cachedNodes: { [key: string]: DOMNode } = {}

  const parse = composeParsers({
    parsers,
    /** Injects a "record keeper" */
    wrapper: function (node: DOMNode, props: NOODLComponentProps) {
      const _appliedProps: { [key: string]: any } = {}

      node.getAttribute = function (key: string) {
        return node.getAttribute(key)
      }

      node.isValidAttribute = function (key: string) {
        if (key && props.type) {
          if (!_cachedNodes[props.type]) {
            // @ts-expect-error
            _cachedNodes[props.type] = document.createElement(props.type)
          }
          return key in _cachedNodes[props.type]
        }
        return false
      }

      node.setAttribute = function <K extends keyof typeof _appliedProps>(
        key: K,
        value: any,
      ) {
        node.setAttribute(key as string, value)
        _appliedProps[key] = value
      }

      return node
    },
  })

  return parse
}

export default createParser
