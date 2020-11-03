import { IComponentTypeInstance } from 'noodl-ui'
import { NOODLDOMElement } from '../../types'

class NOODLDOMBaseComponent {
  #component: IComponentTypeInstance
  #node: NOODLDOMElement | null = null

  constructor(node: NOODLDOMElement | null, component: IComponentTypeInstance) {
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
