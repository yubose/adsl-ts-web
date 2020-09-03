import _ from 'lodash'
import { NOODLComponentProps } from 'noodl-ui'
import createElement from './createElement'

export interface Parser {
  <Elem extends ReturnType<typeof createElement>>(
    node: Elem,
    props: NOODLComponentProps,
  ): void
}

function composeParsers(...parsers: Parser[]) {
  return (props: NOODLComponentProps) => {
    let node: ReturnType<typeof createElement> | undefined

    if (props.type) {
      node = createElement(props.type)
      if (node) {
        _.forEach(parsers, (parse: Parser) =>
          parse(node as ReturnType<typeof createElement>, props),
        )
      }
    }

    return node
  }
}

export default composeParsers
