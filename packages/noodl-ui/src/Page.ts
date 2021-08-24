import type { ComponentObject } from 'noodl-types'
import { getRandomKey, inspect } from './utils/internal'
import type { IPage } from './types'
import Viewport from './Viewport'

type OnChangeFn = (prevPage: string, newPage: string) => void

class Page implements IPage {
  static _id: IPage['id'] = 'root'
  #get: () => ComponentObject[] = () => []
  #onChange: OnChangeFn | undefined
  #id: IPage['id']
  #page = ''
  created: number
  viewport: Viewport;

  [inspect]() {
    return this.toJSON()
  }

  constructor(
    viewport: Viewport = new Viewport(),
    { id = getRandomKey() }: { id?: IPage['id'] } = {},
  ) {
    this.#id = id
    this.created = Date.now()
    this.viewport = viewport
  }

  get id() {
    return this.#id
  }

  get components() {
    return this.#get()
  }

  get page() {
    return this.#page
  }

  set page(name: string) {
    const prev = name
    this.#page = name
    this.#onChange?.(prev, name)
  }

  toJSON() {
    return {
      created: this.created,
      components: this.components,
      currentPage: this.page,
      id: this.#id,
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
    if (typeof getComponents === 'function') {
      this.#get = getComponents
    } else if (typeof getComponents === 'object') {
      if ('onChange' in getComponents) {
        this.#onChange = getComponents.onChange
      }
    }
    return this
  }
}

export default Page
