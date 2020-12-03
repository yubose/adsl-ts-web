import { Component } from 'noodl-ui'
import { NOODLDOMElement } from '../../types'

class NOODLDOMBaseComponent {
  #component: Component
  #node: NOODLDOMElement | null = null

  constructor(node: NOODLDOMElement | null, component: Component) {
    this.#node = node
    this.#component = component
  }

  get component() {
    return this.#component
  }

  get node() {
    return this.#node
  }

  set node(node: NOODLDOMElement | null) {
    this.#node = node
  }
}

export default NOODLDOMBaseComponent
