// @ts-nocheck
import { Scalar } from 'yaml/types'
import {
  NOODLComponentType,
  NOODLContentType,
  NOODLActionType,
} from '../../../src/types'
import { availableComponentTypes } from '../../../src/resolvers/getElementType'
import { availableContentTypes } from '../../../src/resolvers/getTransformedAliases'
import { availableActionTypes } from '../../../src/makeActionChain'

export type NOODLScalarIdentifiers =
  | NOODLComponentType
  | NOODLContentType
  | NOODLActionType
  | 'dataKey'
  | 'divider'
  | 'evaluate'
  | 'globalReference'
  | 'localReference'
  | 'path'
  | 'replace'
  | 'reference'
  | 'type'

export interface Identifier {
  (node: Scalar, ...args: any[]): boolean
}

export type IdentifyScalar = Record<NOODLScalarIdentifiers, Identifier>

const identifyScalar = {} as IdentifyScalar

function _createIdentifier(identify: Identifier, ...args: any[]) {
  return (node) => {
    return node instanceof Scalar
      ? identify(node, ...args)
      : identify(new Scalar(node), ...args)
  }
}

const keywordsFromLib = [
  ...availableActionTypes,
  ...availableComponentTypes,
  ...availableContentTypes,
]

keywordsFromLib.forEach((value) => {
  identifyScalar[value] = _createIdentifier((node) => {
    return node.value === value
  })
})

/* -------------------------------------------------------
  ---- COMPONENTS
-------------------------------------------------------- */

identifyScalar['button'] = _createIdentifier((node) => {
  return node.value === 'button'
})

identifyScalar['dataKey'] = _createIdentifier((node) => {
  return node.value === 'dataKey'
})

identifyScalar['evaluate'] = _createIdentifier((node) => {
  return node.value.startsWith('=')
})

identifyScalar['globalReference'] = _createIdentifier((node) => {
  return /^\.[A-Z]/.test(node.value)
})

identifyScalar['localReference'] = _createIdentifier((node) => {
  return /^(\.\.|_)[a-zA-Z0-9]/i.test(node.value)
})

identifyScalar['path'] = _createIdentifier((node) => {
  return /^path$/i.test(node.value)
})

identifyScalar['reference'] = _createIdentifier((node) => {
  return (
    identifyScalar.evaluate(node) ||
    identifyScalar.globalReference(node) ||
    identifyScalar.localReference(node)
  )
})

identifyScalar['type'] = _createIdentifier((node) => {
  return node.value === 'type'
})

export default identifyScalar
