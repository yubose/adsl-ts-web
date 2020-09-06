import _ from 'lodash'
import { NOODLComponentProps } from 'noodl-ui'
import createElement from './createElement'

// Locally created node to avoid import circular dependency
// for type DOMNode
type CreatedNode = ReturnType<typeof createElement>

export interface Parser {
  (
    node: CreatedNode,
    props: NOODLComponentProps,
    options: { toDOMNode?: (props: NOODLComponentProps) => CreatedNode },
  ): void
}

export type ComposeParserOptions =
  | [options: any, ...parsers: Parser[]]
  | {
      parsers: Parser[]
      wrapper?: (node: CreatedNode) => CreatedNode
    }

function composeParsers(...parsers: ComposeParserOptions) {
  let wrapper: (node: CreatedNode | undefined) => CreatedNode
  let toDOMNode: (props: NOODLComponentProps) => CreatedNode

  if (_.isPlainObject(parsers[0])) {
    parsers = parsers[0].parsers
    wrapper = parsers[0].wrapper
    toDOMNode = parsers[0].toDOMNode
  }

  return function parseProps(props: NOODLComponentProps) {
    let node: CreatedNode | undefined

    if (props.type) {
      node = createElement(props.type)
    }

    if (_.isFunction(wrapper)) {
      node = wrapper(node)
    }

    _.forEach(parsers, (fn: Parser) =>
      fn(node as CreatedNode, props, { toDOMNode }),
    )

    return node
  }
}

export default composeParsers
