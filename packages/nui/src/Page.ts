import type { LiteralUnion } from 'type-fest'
import type { VNode } from 'snabbdom/vnode'
import { h, init } from 'snabbdom'
import tovnode from 'snabbdom/tovnode'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import { getRandomKey } from './utils/internal'
import NuiViewport from './Viewport'
import isNuiViewport from './utils/isViewport'
import patch from './utils/patch'
import * as c from './constants'
import * as i from './utils/internal'
import * as t from './types'

type OnChangeFn = (prevPage: string, newPage: string) => void
interface ConstructorOptions {
  container?: HTMLElement
  width?: number
  height?: number
  id?: NuiPage['id']
  viewport?: NuiViewport
}

let rootInstantiated = false

class NuiPage {
  #id: LiteralUnion<'root', string>
  #vnode: VNode
  #page = ''
  #viewport: NuiViewport
  created: number
  defaults = { componentMap: {} } as {
    componentMap: Record<nt.ComponentType, string>
  }

  static _id: LiteralUnion<'root', string> = 'root';

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      created: this.created,
      defaults: this.defaults,
      id: this.id,
      page: this.page,
      viewport: this.viewport,
    }
  }

  constructor(options: ConstructorOptions)
  constructor(viewport?: NuiViewport, id?: NuiPage['id'])
  constructor(
    viewport?: NuiViewport,
    container?: HTMLElement | string,
    id?: NuiPage['id'],
  )
  constructor(
    options?: NuiViewport | ConstructorOptions,
    containerOrId?: HTMLElement | string,
    id = '',
  ) {
    let _id = ''
    let _container: HTMLElement | null = null

    if (options === undefined) {
      this.#viewport = new NuiViewport()
    } else if (isNuiViewport(options)) {
      this.#viewport = options
      if (u.isStr(containerOrId)) {
        _id = containerOrId
      } else if (containerOrId) {
        _container = containerOrId
        if (u.isStr(id)) _id = id
      }
    } else {
      options.container && (_container = options.container)
      options.id && (_id = options.id)
      isNuiViewport(options.viewport) && (this.#viewport = options.viewport)
      if ('width' in options || 'height' in options) {
        if (!isNuiViewport(options.viewport)) this.#viewport = new NuiViewport()
        u.assign(this.viewport, {
          width: options.width,
          height: options.height,
        })
      }
    }

    this.#id = !rootInstantiated ? 'root' : _id || getRandomKey()
    this.#vnode = tovnode(document.createElement('div'))
    this.created = Date.now()
    const newVnode = patch(this.vnode, h(`div#${this.#id}`, { id: this.#id }))
    newVnode.elm && (_container || document.body).appendChild(newVnode.elm)
  }

  get elem() {
    return this.vnode.elm
  }

  get vnode() {
    return this.#vnode
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

  draw(component: nt.ComponentObject, container = this.elem as HTMLElement) {
    return container
      ? patch(
          container,
          h(i.getElementType(this.defaults.componentMap, component)),
        )
      : null
  }

  render(component: nt.ComponentObject, container = this.elem) {
    const vnode = this.draw(component)
    console.log(vnode)

    if (vnode?.elm) {
      container && patch(container, vnode)
    } else {
      console.log(`%cNo element found for vnode`, `color:#ec0000;`, {
        component,
        vnode,
      })
    }
  }

  // toJSON() {
  //   return {
  //     created: this.created,
  //     components: this.components,
  //     currentPage: this.page,
  //     id: this.id,
  //     viewport: {
  //       width: this.viewport?.width || null,
  //       height: this.viewport?.height || null,
  //     },
  //   }
  // }

  // toString() {
  //   return JSON.stringify(this.toJSON?.(), null, 2)
  // }
}

export default NuiPage
