import _ from 'lodash'
import { Styles } from 'app/types'
import { setStyle } from 'utils/dom'

class BaseComponent {
  public id: string
  public node: HTMLElement

  constructor({ id = '', node }: { id?: string; node?: HTMLElement } = {}) {
    this.id = id
    this.node = node || document.createElement('div')
    this.node.id = this.id
  }

  public render(html?: string) {
    if (arguments.length) {
      this.node.innerHTML = `${html}`
    }
    if (!document.body.contains(this.node)) {
      document.body.appendChild(this.node)
    }
    return this
  }

  public remove() {
    if (document.body.contains(this.node)) {
      document.body.removeChild(this.node)
    }
    return this
  }

  /**
   *
   * @param { HTMLElement | string | Styles } node - DOM node, HTML string content or an object of style properties
   * @param { string | Styles | undefined } key - Style key or an object of style properties
   * @param { any | undefined } value - Value
   */
  public setStyle(
    node: HTMLElement | string | Styles = this.node,
    key?: string | Styles,
    value?: any,
  ) {
    if (_.isString(node)) {
      // Set the styles on the node modal if a node was not given
      setStyle(this.node, key, value)
    } else if (node instanceof HTMLElement) {
      setStyle(node, key, value)
    } else {
      setStyle(this.node, node, key)
    }
    return this
  }
}

export default BaseComponent
