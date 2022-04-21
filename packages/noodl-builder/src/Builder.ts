import ActionBuilder from './Action'
import ComponentBuilder from './Component'
import ObjectBuilder from './Object'
import PageBuilder from './Page'
import EcosDocBuilder from './EcosDoc'
import type NoodlBase from './Base'
import type { EcosDocPreset } from './types'

class Builder {
  #nodes = new Map<number, NoodlBase>()
  #action: ActionBuilder
  #component: ComponentBuilder
  #ecosDoc: EcosDocBuilder
  #object: ObjectBuilder
  #page: PageBuilder

  constructor() {
    this.#action = new ActionBuilder()
    this.#component = new ComponentBuilder()
    this.#ecosDoc = new EcosDocBuilder()
    this.#object = new ObjectBuilder()
    this.#page = new PageBuilder()
  }

  action(actionType: string) {
    const action = this.#action.create(actionType)
    return action
  }

  component(type: string) {
    const component = this.#component.create(type)
    return component
  }

  ecosDoc(preset?: EcosDocPreset) {
    const ecosDoc = this.#ecosDoc.create()
    if (preset) ecosDoc.usePreset(preset)
    return ecosDoc
  }

  object() {
    const object = this.#object.create()
    return object
  }

  page(name: string) {
    const page = this.#page.create(name)
    return page
  }

  getNodeByKey(key: number) {
    return this.#nodes.get(key)
  }
}

export default Builder
