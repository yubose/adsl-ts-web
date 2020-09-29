import { YAMLSeq } from 'yaml/types'
import identifyMap from './identifyMap'

export type NOODLSeqIdentities = 'actionChain'

export interface Identifier {
  (node: YAMLSeq): boolean
}

export type IdentifySeq = Record<NOODLSeqIdentities, Identifier>

const identifySeq: IdentifySeq = {} as IdentifySeq

function _createIdentifier(identify: Identifier) {
  return (node) => {
    if (node instanceof YAMLSeq) return identify(node)
    return false
  }
}

identifySeq['actionChain'] = _createIdentifier((node) => {
  for (let index = 0; index < node.items.length; index++) {
    const item = node.items[index]
    if (identifyMap.actionObject(item)) {
      return true
    }
  }
  return false
})

export default identifySeq
