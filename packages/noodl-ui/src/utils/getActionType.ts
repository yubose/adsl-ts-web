import { Identify } from 'noodl-types'
import { NUIActionObjectInput, NUIActionType } from '../types'

function getActionType(obj: NUIActionObjectInput): NUIActionType {
  if (obj !== null && typeof obj === 'object') {
    if ('actionType' in obj) return obj.actionType
    if (Identify.emit(obj)) return 'emit'
    if (Identify.goto(obj)) return 'goto'
    if (Identify.toast(obj)) return 'toast'
  }
  return 'anonymous'
}

export default getActionType
