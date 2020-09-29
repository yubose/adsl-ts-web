import { Pair, Scalar } from 'yaml/types'
import identifyMap from './identifyMap'
import identifySeq from './identifySeq'
import identifyScalar from './identifyScalar'
import { log, logBlue, logYellow } from './log'

export const commonKeywords = [
  // Globals
  'Document',
  'DocAPI',
  'Edge',
  'EdgeAPI',
  'Global',
  'Message',
  'Vertex',
  'VertexAPI',
  'Style',
  'formData',
  'module',
  // Components
  'button',
  'dateSelect',
  'divider',
  'footer',
  'header',
  'image',
  'label',
  'list',
  'listItem',
  'popUp',
  'searchBar',
  'select',
  'scrollView',
  'textField',
  'textView',
  'view',
  // Component properties
  'children',
  'contentType',
  'dataKey',
  'icon',
  'inputType',
  'isEditable',
  'maxPresent',
  'onClick',
  'options',
  'path',
  'pathSelected',
  'placeholder',
  'resource',
  'selected',
  'selected',
  'text',
  'textSelected',
  'style',
  'type',
  'viewTag',
] as const

export type NOODLPairIdentities =
  | typeof commonKeywords[number]
  | 'actionChain'
  | 'page'

export interface Identifier {
  (node: Pair): boolean
}

export type IdentifyPair = Record<NOODLPairIdentities, Identifier>

const identifyPair = {} as IdentifyPair

function _createIdentifier(identify: Identifier) {
  return (node) => {
    if (node instanceof Pair) return identify(node)
    return false
  }
}

// Convenience func for just querying commonKeywords
function _createIdentifierByKeyword(keyword: string) {
  return _createIdentifier((pair) => {
    return identifyScalar[keyword]?.(pair.key)
  })
}

// Attach keyword identifiers
commonKeywords.forEach((keyword) => {
  identifyPair[keyword] = _createIdentifierByKeyword(keyword)
})

identifyPair['actionChain'] = _createIdentifier((pair) => {
  return identifySeq.actionChain(pair.value)
})

export default identifyPair
