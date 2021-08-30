import { LiteralUnion } from 'type-fest'
import { h, toVNode } from 'snabbdom'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import { getRandomKey } from './utils/internal'
import NuiViewport from './Viewport'
import patch from './utils/patch'
import * as c from './constants'
import * as i from './utils/internal'
import * as t from './types'

type OnChangeFn = (prevPage: string, newPage: string) => void

class Page {
  #id: LiteralUnion<'root', string>
  #page = ''
  #viewport: NuiViewport
  created: number
  defaults = { componentMap: {} } as {
    componentMap: Record<nt.ComponentType, string>
  }

  static _id: LiteralUnion<'root', string> = 'root';

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor(
    viewport: NuiViewport = new NuiViewport(),
    { id = getRandomKey() } = {},
  ) {
    this.#id = id
    this.#viewport = viewport
    this.created = Date.now()
  }

  get id() {
    return this.#id
  }

  get components() {
    return []
  }

  get page() {
    return this.#page
  }

  set page(name: string) {
    const prev = this.#page
    this.#page = name
    // this.#onChange?.(prev, name)
  }

  get viewport() {
    return this.#viewport || null
  }

  draw(component: nt.ComponentObject) {
    const leftVnode = h(i.getElementType(this.defaults.componentMap, component))
    const rightVnode = h(
      i.getElementType(this.defaults.componentMap, component),
    )
    const vnode = patch(leftVnode, rightVnode)
    return vnode
  }

  render(container: HTMLElement, elem: HTMLElement) {
    container.appendChild(elem)
  }

  toJSON() {
    return {
      created: this.created,
      components: this.components,
      currentPage: this.page,
      id: this.id,
      viewport: {
        width: this.viewport?.width || null,
        height: this.viewport?.height || null,
      },
    }
  }

  toString() {
    return JSON.stringify(this.toJSON?.(), null, 2)
  }

  use(options: { onChange: OnChangeFn }): void
  use(getComponents: () => Page['components']): void
  use(getComponents: (() => Page['components']) | { onChange: OnChangeFn }) {
    if (u.isFnc(getComponents)) {
      // this.#get = getComponents
    } else if (u.isObj(getComponents)) {
      if ('onChange' in getComponents) {
        // this.onChange = getComponents.onChange
      }
    }
    return this
  }
}

export default Page
