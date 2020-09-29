import { YAMLMap } from 'yaml/types'

export interface Identifier {
  (node: YAMLMap): boolean
}

export type NOODLMapIdentities =
  | 'actionObject'
  | 'component'
  | 'page'
  | 'style'
  | 'textAlign'

export type IdentifyMap = Record<NOODLMapIdentities, Identifier>

const identifyMap = {} as IdentifyMap

function _createIdentifier(identify: Identifier) {
  return (node: unknown) => {
    if (node instanceof YAMLMap) {
      return identify(node)
    }
    return false
  }
}

identifyMap['actionObject'] = _createIdentifier((node) => {
  return node.get('actionType')
})

identifyMap['component'] = _createIdentifier((node) => {
  return (node.has('children') || node.has('style')) && node.has('type')
})

identifyMap['page'] = _createIdentifier((node) => {
  // If this is a page, node.items[0].key is a Scalar { type: 'PLAIN', value: 'SignIn' }
  if (node.items[0].value instanceof YAMLMap) {
    for (let index = 0; index < node.items[0].value.items.length; index++) {
      const item = node.items[0].value.items[index]
      if (['module', 'components'].includes(item.key.value)) {
        return true
      }
    }
  }
  return false
})

export default identifyMap
