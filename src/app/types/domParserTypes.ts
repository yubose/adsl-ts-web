import { NOODLComponentProps } from 'noodl-ui'
import { noodlDomParserEvents } from '../../constants'
import { NOODLElement } from './pageTypes'

export type DOMParserEvent = typeof noodlDomParserEvents[keyof typeof noodlDomParserEvents]

export interface Parser {
  (
    node: NOODLElement,
    props: NOODLComponentProps,
    parserOptions: ParserOptions,
  ): void
}

export interface ParserOptions {
  parse: (props: NOODLComponentProps) => NOODLElement | undefined
}
