import _ from 'lodash'
import { PageModalState, Styles } from 'app/types'
import { forEachEntries } from 'utils/common'
import NOODLElement from 'components/NOODLElement'

class Modal extends NOODLElement {
  public _id: string = 'noodl-ui-modal'
  public id: PageModalState['id'] = ''
  public body: HTMLDivElement
  public context: PageModalState['context'] = null
  public opened: PageModalState['opened'] = false
  public props: PageModalState['props'] = {}

  constructor({
    contentStyle,
    node = document.createElement('div'),
  }: { contentStyle?: Styles; node?: HTMLElement } = {}) {
    super({ node })
    this.node.id = this._id
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

  public open(
    id: string,
    children: HTMLElement | NOODLElement | string | number | undefined,
    options: Omit<PageModalState, 'id'>,
  ) {
    if (!this.isRendered()) {
      this.id = id
      if (_.isPlainObject(options)) {
        forEachEntries(options, (key, value) => {
          // @ts-expect-error
          this[key] = value
        })
      }
      if (children) {
        if (children instanceof HTMLElement) {
          this.body.appendChild(children)
        } else if (children instanceof NOODLElement) {
          // @ts-expect-error
          children = new children({ container: this.body })
        } else {
          this.body.innerHTML = `${children}`
        }
      }
      this.render()
    }
  }

  public close() {
    if (this.isRendered()) {
      this.body.innerHTML = ''
      this.remove()
    }
  }

  public setContainerStyle(key: string | Styles, value?: any) {
    this.setStyle(this.node, key, value)
  }

  getState() {
    return {
      context: this.context,
      id: this.id,
      opened: this.opened,
      props: { ...this.props },
    }
  }

  private _refreshViewport(e?: Event) {
    super.setStyle({
      width: `${window.innerWidth}px`,
      height: `${window.innerHeight}px`,
    })
  }
}

export default Modal
