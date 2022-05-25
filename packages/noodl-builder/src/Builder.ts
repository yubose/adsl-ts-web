import ActionBuilder from './Action'
import ComponentBuilder from './Component'
import NoodlArray from './Array'
import NoodlObject from './Object'
import PageBuilder from './Page'
import EcosDoc from './EcosDoc'
import type NoodlBase from './Base'
import type { EcosDocPreset } from './types'

class Builder {
  #nodes = new Map<number, NoodlBase>()
  #action: ActionBuilder
  #component: ComponentBuilder
  #ecosDoc: typeof EcosDoc
  #array: typeof NoodlArray
  #object: typeof NoodlObject
  #page: PageBuilder

  constructor() {
    this.#action = new ActionBuilder()
    this.#component = new ComponentBuilder()
    this.#ecosDoc = EcosDoc
    this.#array = NoodlArray
    this.#object = NoodlObject
    this.#page = new PageBuilder()
  }

  action(actionType: string) {
    const action = this.#action.create(actionType)
    return action
  }

  component<O extends Record<string, any> = Record<string, any>>(type: string) {
    const component = this.#component.create(type)
    return component as NoodlObject<O>
  }

  ecosDoc(preset?: EcosDocPreset) {
    const ecosDoc = new this.#ecosDoc()
    if (preset) ecosDoc.usePreset(preset)
    return ecosDoc
  }

  array<A extends any[] = any[]>() {
    const array = new this.#array()
    return array as NoodlArray<A>
  }

  object<O extends Record<string, any> = Record<string, any>>() {
    const object = new this.#object()
    return object as NoodlObject<O>
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
