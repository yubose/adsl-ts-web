import { NOODLComponentProps } from 'noodl-ui'
import { DOMNode } from './pageTypes'

export interface Parser {
  (
    node: DOMNode,
    props: NOODLComponentProps,
    parserOptions: ParserOptions,
  ): void
}

export interface ParserOptions {
  parse: (props: NOODLComponentProps) => DOMNode | undefined
}
