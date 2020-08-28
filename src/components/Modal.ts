import _ from 'lodash'
import NOODLElement from 'components/NOODLElement'
import { Styles } from 'app/types'

class Modal extends NOODLElement {
  public id: string = 'noodl-ui-modal'
  public body: HTMLDivElement

  constructor({ contentStyle }: { contentStyle?: Styles } = {}) {
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
      pointerEvents: 'none',
    })

    this.setStyle(this.body, {
      width: '350px',
      height: '300px',
      boxSizing: 'border-box',
      boxShadow: '0 0 5px 5px rgba(0, 0, 0, 0.3)',
      background: '#fff',
      pointerEvents: 'auto',
      ...contentStyle,
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

  public removeChild(child: HTMLElement) {
    if (this.body.contains(child)) {
      this.body.removeChild(child)
    }
    return this
  }

  public clearContent() {
    this.body.innerHTML = ''
    return this
  }

  public setContainerStyle(key: string | Styles, value?: any) {
    this.setStyle(this.node, key, value)
  }

  private _refreshViewport(e?: Event) {
    this.setStyle({
      width: `${window.innerWidth}px`,
      height: `${window.innerHeight}px`,
    })
  }
}

export default Modal
