import type { ComponentObject } from 'noodl-types'
import NoodlObject from './Object'

class ComponentBuilder extends NoodlObject<ComponentObject> {
  create(type: string) {
    super.create('type', type)
    return this
  }
}

export default ComponentBuilder
