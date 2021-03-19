import Logger from 'logsnap'
import getStore, { Store } from '../store'
import Resolver from '../Resolver'
import Viewport from '../Viewport'
import * as u from '../utils/internal'
import * as T from '../types'

const log = Logger.create('BasePage')

class BasePage {
  #getAssetsUrl: () => string = () => ''
  #getBaseUrl: () => string = () => ''
  #getPreloadPages: () => string[] = () => []
  #getPages: () => string[] = () => []
  #getRoot: () => T.Root[] = () => []
  #plugins: T.PluginObject[] = []
  actionsContext: {
    noodl?: any
    noodlui: BasePage
    ndom?: any
  }
  id = ''
  viewport: Viewport

  constructor() {
    this.actionsContext = { noodlui: this.noodlui }
  }

  get noodlui() {
    return this
  }

  get getAssetsUrl() {
    return this.#getAssetsUrl
  }

  set getAssetsUrl(getAssetsUrl) {
    this.#getAssetsUrl = getAssetsUrl
  }

  get getBaseUrl() {
    return this.#getBaseUrl
  }

  set getBaseUrl(getBaseUrl) {
    this.#getBaseUrl = getBaseUrl
  }

  get getPreloadPages() {
    return this.#getPreloadPages
  }

  set getPreloadPages(getPreloadPages) {
    this.#getPreloadPages = getPreloadPages
  }

  get getPages() {
    return this.#getPages
  }

  set getPages(getPages) {
    this.#getPages = getPages
  }

  get getRoot() {
    return this.#getRoot
  }

  set getRoot(getRoot) {
    this.#getRoot = getRoot
  }

  setPlugin(obj: T.PluginObject) {
    this.#plugins.push(obj)
  }

  use(obj: Store['use']): this
  use(props: {
    actionsContext?: Partial<BasePage['actionsContext']>
    getAssetsUrl?(): string
    getBaseUrl?(): string
    getPreloadPages?(): string[]
    getPages?(): string[]
    getRoot?(): T.Root
    plugins?: T.PluginCreationType[]
  }): this
  use(viewport: Viewport): this
  use(mod: any, ...rest: any[]) {
    ;((u.isArr(mod) ? mod : [mod]) as any[]).concat(rest).forEach((m: any) => {
      if (m) {
        if ('actionType' in m || m instanceof Resolver) {
          getStore().use(m as any)
        } else if (m instanceof Viewport) {
          this.viewport = m
        } else {
          if (
            'actionsContext' in m ||
            'getAssetsUrl' in m ||
            'getBaseUrl' in m ||
            'getPreloadPages' in m ||
            'getPages' in m ||
            'getRoot' in m ||
            'plugins' in m
          ) {
            // prettier-ignore
            if ('actionsContext' in m) Object.assign(this.actionsContext, m.actionsContext)
            if ('getAssetsUrl' in m) this.#getAssetsUrl = m.getAssetsUrl
            if ('getBaseUrl' in m) this.#getBaseUrl = m.getBaseUrl
            if ('getPreloadPages' in m)
              this.#getPreloadPages = m.getPreloadPages
            if ('getPages' in m) this.#getPages = m.getPages
            if ('getRoot' in m) this.#getRoot = m.getRoot
            if ('plugins' in m && u.isArr(m.plugins)) {
              m.plugins.forEach((plugin: T.PluginObject) => {
                this.setPlugin(plugin)
              })
            }
          }
        }
      }
    })
    return this
  }
}

export default BasePage
