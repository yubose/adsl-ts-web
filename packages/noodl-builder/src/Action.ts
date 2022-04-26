import NoodlObject from './Object'

class Action extends NoodlObject {
  create(actionType: string) {
    super.createProperty('actionType', actionType)
    return this
  }
}

export default Action
