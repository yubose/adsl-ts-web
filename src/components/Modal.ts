import _ from 'lodash'
import BaseComponent from 'components/BaseComponent'
import { Styles } from 'app/types'
import { setStyle } from 'utils/dom'

class Modal extends BaseComponent {
  public id: string = 'noodl-ui-modal'
  public body: HTMLDivElement

  constructor() {
    super({ node: document.createElement('div') })
    this.node.id = this.id
    this.body = document.createElement('div')
    this.body.id = this.node.id + '-body'

    this.node.appendChild(this.body)

    this.setStyle({
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'none',
    })

    this.setStyle(this.body, {
      width: '350px',
      height: '300px',
      boxSizing: 'border-box',
    })

    this._refreshViewport()

    window.addEventListener('resize', this._refreshViewport)
  }

  public appendChild(child: HTMLElement) {
    if (!this.body.contains(child)) {
      this.body.appendChild(child)
    }
    return this
  }

  public clearContent() {
    this.body.innerHTML = ''
    return this
  }

  public removeChild(child: HTMLElement) {
    if (this.body.contains(child)) {
      this.body.removeChild(child)
    }
    return this
  }

  public render(html?: string) {
    if (arguments.length) {
      this.node.innerHTML = `${html}`
    }
    document.body.appendChild(this.node)
    return this
  }

  public hide() {
    this.setStyle('visibility', 'hidden')
    return this
  }

  public show() {
    this.setStyle('visibility', 'visible')
    return this
  }

  public remove() {
    document.body.removeChild(this.node)
    return this
  }

  public setContainerStyle(key: string | Styles, value?: any) {
    this.setStyle(this.node, key, value)
  }

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

  private _refreshViewport(e?: Event) {
    this.setStyle({
      width: `${window.innerWidth}px`,
      height: `${window.innerHeight}px`,
    })
  }
}

export default Modal
