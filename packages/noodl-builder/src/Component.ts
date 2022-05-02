import NoodlObject from './Object'

class ComponentBuilder {
  create(type?: string) {
    const component = new NoodlObject()
    if (type) component.createProperty('type', type)
    return component
  }
}

export default ComponentBuilder
