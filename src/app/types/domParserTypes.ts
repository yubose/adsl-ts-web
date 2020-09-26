import { NOODLComponentProps } from 'noodl-ui'
import { noodlDomParserEvents } from '../../constants'
import { NOODLElement } from './pageTypes'

export type DOMParserEvent = typeof noodlDomParserEvents[keyof typeof noodlDomParserEvents]

export interface Parser {
  (
    node: NOODLElement,
    props: NOODLComponentProps,
    parserOptions?: ParserOptions,
  ): any
}

export type ParserArgs = Parameters<Parser>

export interface ParserOptions {
  parse: (props: NOODLComponentProps) => NOODLElement | undefined
}
