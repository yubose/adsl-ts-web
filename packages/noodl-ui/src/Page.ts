import { PageObject } from 'noodl-types'
import { getRandomKey, inspect } from './utils/internal'
import { IPage } from './types'
import Viewport from './Viewport'

class Page implements IPage {
  static _id: IPage['id'] = 'root'
  #get: () => PageObject = () => ({ components: [] })
  #id: IPage['id']
  #page = ''
  viewport: Viewport;

  [inspect]() {
    return this.toJSON()
  }

  constructor(
    viewport: Viewport = new Viewport(),
    { id = getRandomKey() }: { id?: IPage['id'] } = {},
  ) {
    this.#id = id
    this.viewport = viewport
  }

  get id() {
    return this.#id
  }

  object() {
    return this.#get?.() || { components: [] }
  }

  get page() {
    return this.#page
  }

  set page(name: string) {
    this.#page = name
  }

  toJSON() {
    return {
      id: this.#id,
      viewport: { width: this.viewport.width, height: this.viewport.height },
    }
  }

  toString() {
    return JSON.stringify(this.toJSON(), null, 2)
  }

  use(getObj: Page['object']) {
    this.#get = getObj
    return this
  }
}

export default Page
