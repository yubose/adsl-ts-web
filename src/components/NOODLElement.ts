import _ from 'lodash'
import { Styles } from 'app/types'
import { setStyle } from 'utils/dom'

class NOODLElement {
  public container: HTMLElement | undefined
  public id: string
  public modalId: string = ''
  public node: HTMLElement
  public refs: { [key: string]: HTMLElement } = {}

  constructor({
    container,
    id = '',
    node,
  }: {
    container?: HTMLElement
    id?: string
    node?: HTMLElement
  } = {}) {
    this.container = container
    this.id = id
    this.node = node || document.createElement('div')
    this.node.id = this.id
  }

  public hide() {
    this.setStyle('visibility', 'hidden')
    return this
  }

  public show() {
    this.setStyle('visibility', 'visible')
    return this
  }

  /**
   * Returns true if this element is hidden.
   * Note: This can still return true if the element is rendered/appended
   * to the DOM but is hidden. For that usage, use this.isRendered instead
   */
  public isHidden() {
    return this.node?.style?.visibility === 'hidden'
  }

  /**
   * Returns true if this element is visibile.
   * Note: This can still return true if the element is NOT rendered/appended
   * to the DOM. For that usage, use this.isRendered instead
   */
  public isVisible() {
    return !this.isHidden()
  }

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
   * Returns true if this element is appended to the DOM
   */
  public isRendered() {
    return !!this.node && (this.container || document.body).contains(this.node)
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

export default NOODLElement
