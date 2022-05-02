import NoodlObject from './Object'

class ActionBuilder {
  create(actionType?: string) {
    const action = new NoodlObject()
    if (actionType) action.createProperty('actionType', actionType)
    return action
  }
}

export default ActionBuilder
