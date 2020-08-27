import _ from 'lodash'
import CADL from '@aitmed/cadl'
import { NOODLComponent, Page as NOODLUiPage } from 'noodl-ui'
import Modal from './components/Modal'
import { cadl, noodl } from './app/client'
import { OnBeforePageChange } from './app/types'
import { toDOMNode } from './utils/noodl'

export type PageListenerName = 'onBeforePageChange' | 'onBeforePageRender'

export interface PageOptions {
  currentPage?: string
  rootNode?: HTMLElement | null
  nodes?: HTMLElement[] | null
  builtIn?: {
    [funcName: string]: any
  }
}

/**
 * This Page class is responsible for managing a NOODL page's state that is relative
 * to the page that is being presented to the user, like managing parsed components or
 * action chains that are running.
 */
class Page {
  private _initializeRootNode: () => void
  private _listeners: { [name: string]: Function } = {}
  public builtIn: PageOptions['builtIn']
  public rootNode: HTMLElement | null = null
  public nodes: HTMLElement[] | null
  public modal: Modal

  constructor({ builtIn, rootNode = null, nodes = null }: PageOptions = {}) {
    this.builtIn = builtIn
    this.rootNode = rootNode
    this.nodes = nodes

    this._initializeRootNode = () => {
      const root = document.createElement('div')
      root.id = 'root'
      root.style.position = 'absolute'
      root.style.width = '100%'
      root.style.height = '100%'
      this.rootNode = root
      document.body.appendChild(root)
    }

    this.modal = new Modal()
  }

  public async navigate(...args: Parameters<CADL['initPage']>) {
    const [pageName, arr = [], options] = args

    if (!this.rootNode) {
      this._initializeRootNode()
    }

    this._callListener('onBeforePageChange', {
      rootNode: this.rootNode,
    } as OnBeforePageChange)

    if (!pageName) {
      const logMsg = `%c[Page.ts][navigate] Cannot navigate because pageName is invalid`
      const logStyle = `color:#ec0000;font-weight:bold;`
      console.log(logMsg, logStyle, { pageName, rootNode: this.rootNode })
      window.alert(`The value of page "${pageName}" is not valid`)
    } else {
      // Load the page in the SDK
      await cadl.initPage(pageName, arr, {
        ...options,
        builtIn: {
          ...this.builtIn,
          ...options?.builtIn,
        },
      })

      const page: NOODLUiPage = {
        name: pageName,
        object: cadl.root?.[pageName],
      }

      noodl.setPage(page)

      this._callListener('onBeforePageRender', page)

      this.render(cadl?.root?.[pageName]?.components)
    }
  }

  /**
   * Returns the link to the main dashboard page by using the noodl base url
   * @param { string } baseUrl - Base url retrieved from the noodl config
   */
  public getDashboardPath(baseUrl: string = cadl.cadlBaseUrl || '') {
    const isMeetingConfig = /meeting/i.test(baseUrl)
    const regex = isMeetingConfig ? /(dashboardmeeting|meeting)/i : /dashboard/i
    return this.getPagePath(regex)
  }

  /** Handles onClick events for "goTo" handling.
   *    Ex: A NOODL page gives an onClick a value of "goToDashboard"
   *     The underlying function here will take a path string/regex and find a matching
   *     page path from the config, and will return the path if found.
   *     Otherwise it will return an empty string
   * @param { null | NOODLConfig } config
   * @return { string }
   */
  public getPagePath(pageName: string | RegExp) {
    const pages = cadl?.cadlEndpoint?.page || []
    const pagePath = _.find(pages, (name: string) =>
      _.isString(pageName)
        ? name.includes(pageName)
        : pageName instanceof RegExp
        ? pageName.test(name)
        : false,
    )
    return pagePath || ''
  }

  /** Navigates to a page using a portion of a page path uri
   * @param { string } pageName - Name of the page
   */
  // TODO: This func will will be deprecated in favor of this.navigate
  public async goToPage(pageName: string) {
    // Ensure the first letter is uppercased
    pageName = _.upperFirst(String(pageName))
    const pagePath = this.getPagePath(pageName)
    if (pagePath) {
      //
    } else {
      window.alert(`Could not find page ${pageName}`)
    }
  }

  public registerListener(
    listenerName: PageListenerName,
    listener: (...args: any[]) => any,
  ) {
    if (!_.isFunction(this._listeners[listenerName])) {
      this._listeners[listenerName] = listener
    } else {
      const logMsg = `%cAn existing listener named ${listenerName} was already registered. It will be removed and replaced with this one`
      const logStyle = `color:#ec0000;font-weight:bold;`
      console.log(logMsg, logStyle)
    }
    return this
  }

  public hasListener(listenerName: string) {
    return _.isFunction(this._listeners[listenerName])
  }

  /**
   * Takes a list of raw NOODL components and converts them into DOM nodes and appends
   * them to the DOM
   * @param { NOODLUIPage } page - Page in the shape of { name: string; object: null | NOODLPageObject }
   */
  public render(rawComponents: NOODLComponent[]) {
    // @ts-expect-error
    window.components = rawComponents

    if (_.isArray(rawComponents)) {
      const components = noodl.resolveComponents()
      // @ts-expect-error
      window.resolvedComponents = components

      let rootId = '',
        node

      if (this.rootNode) {
        rootId = this.rootNode.id

        // Clean up previous nodes
        this.rootNode.innerHTML = ''

        _.forEach(components, (component) => {
          node = toDOMNode(component)
          if (node) {
            this.rootNode?.appendChild(node)
          }
        })
      } else {
        const logMsg =
          "Attempted to render the page's components but the root " +
          'node was not initialized. The page will not show anything'
        const logStyle = `color:#ec0000;font-weight:bold;`
        console.log(logMsg, logStyle, this.getSnapshot())
      }
    } else {
      // TODO
    }

    return this
  }

  /**
   * Takes a "snapshot" of the current page and returns a JSON representation.
   * Useful for debug logs
   */
  public getSnapshot() {
    return {
      rootNode: this.rootNode,
      nodes: this.nodes,
    }
  }

  private _callListener(listenerName: PageListenerName, ...args: any[]) {
    const result = this._listeners[listenerName]?.(...args)
    if (result && result instanceof Promise) {
      return Promise.resolve(result)
    }
    return result
  }
}

export default Page
