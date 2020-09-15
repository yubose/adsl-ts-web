import { NOODLComponentProps } from 'noodl-ui'
import { noodlDomParserEvents } from '../../constants'
import { DOMNode } from './pageTypes'

export type DOMParserEvent = typeof noodlDomParserEvents[keyof typeof noodlDomParserEvents]

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
