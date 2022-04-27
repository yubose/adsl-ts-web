import type { ComponentObject } from 'noodl-types'
import NoodlObject from './Object'

class ComponentBuilder extends NoodlObject {
  create(type: string) {
    super.createProperty('type', type)
    return this
  }
}

export default ComponentBuilder
