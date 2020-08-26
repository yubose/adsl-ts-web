import _ from 'lodash'
import { Styles } from 'app/types'
import { setStyle } from 'utils/dom'

// type StoredNodes<Elem = HTMLElement> = { [name: string]: Elem }

class BaseComponent {
  public container: HTMLElement | undefined
  public id: string
  public node: HTMLElement

  constructor({
    container,
    id = '',
    node,
  }: { container?: HTMLElement; id?: string; node?: HTMLElement } = {}) {
    this.container = container
    this.id = id
    this.node = node || document.createElement('div')
    this.node.id = this.id
  }

  /**
   * Sets nodes to locally stored nodes
   * @param { string | StoredNodes } name - Node name or an object of nodes
   */
  // public addMember<Elem = HTMLElement>(
  //   name: string | StoredNodes<Elem>,
  //   node?: HTMLElement | StoredNodes<Elem>,
  // ) {
  //   if (_.isString(name)) {
  //     this.nodes[name] = node as HTMLElement
  //   } else if (_.isPlainObject(name)) {
  //     _.assign(this.nodes, name)
  //   }
  //   return this
  // }

  /**
   * Removes a node from locally stored nodes
   * @param { string } name - Node name
   */
  // public removeMember(name: string) {
  //   delete this.nodes[name]
  //   return this
  // }

  /**
   * Appends the current node to the DOM if it doesn't already exist
   * If html is a string, it will be inserted to the node via innerHTML before
   * being appended to the DOM
   * @param { string? } html
   */
  public render(html?: string) {
    if (_.isString(html)) {
      this.node.innerHTML = `${html}`
    }
    const container = this.container || document.body
    if (!container.contains(this.node)) {
      container.appendChild(this.node)
    }
    return this
  }

  /**
   * Removes the current node from the DOM
   */
  public remove() {
    const container = this.container || document.body
    if (container.contains(this.node)) {
      container.removeChild(this.node)
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
