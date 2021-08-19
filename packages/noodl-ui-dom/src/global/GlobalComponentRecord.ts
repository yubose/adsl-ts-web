import { NUIComponent } from 'noodl-ui'
import GlobalRecord from './GlobalRecord'
import Page from '../Page'

export interface GlobalComponentMapOptions {
  component: NUIComponent.Instance
  id?: string
  node?: HTMLElement | null
  page: Page
}

class GlobalComponentRecord extends GlobalRecord<'component'> {
  #id: string = ''
  componentId: string
  nodeId: string | undefined
  pageId: string;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor({ id, component, node, page }: GlobalComponentMapOptions) {
    super()

    if (!id) {
      this.#id = component?.get?.('data-globalid')
    } else {
      this.#id = id
    }

    this.componentId = component.id
    this.nodeId = node?.id || component.id || ''
    this.pageId = page.id as string
  }

  get globalId() {
    return this.#id
  }

  set globalId(globalId) {
    this.#id = globalId
  }

  toJSON() {
    return {
      globalId: this.globalId,
      componentId: this.componentId,
      nodeId: this.nodeId,
      pageId: this.pageId,
    }
  }
}

export default GlobalComponentRecord
