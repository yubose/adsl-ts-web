import type { ActionObject } from 'noodl-types'
import NoodlObject from './Object'

class Action extends NoodlObject<ActionObject> {
  create(actionType: string) {
    super.create('actionType', actionType)
    return this
  }
}

export default Action
