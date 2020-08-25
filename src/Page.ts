import CADL from '@aitmed/cadl'
import _ from 'lodash'
import { NOODLComponent, Page as NOODLUiPage } from 'noodl-ui'
import { cadl } from './app/client'
import { OnAfterPageChangeArgs } from './app/types'
import { toDOMNode } from './utils/noodl'
import { setCurrentPage } from 'features/page'
import app, { App } from './App'

export type PageListenerName = 'onBeforePageChange' | 'onAfterPageChange'

export interface PageOptions {
  name?: string
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

  constructor({ rootNode = null, nodes = null, builtIn }: PageOptions = {}) {
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
  }

  public async navigate(...args: Parameters<CADL['initPage']>) {
    const [pageName, arr = [], options] = args

    if (!this.rootNode) {
      this._initializeRootNode()
    }

    this._callListener('onBeforePageChange')

    // Load the page in the SDK
    await cadl.initPage(pageName, arr, {
      ...options,
      builtIn: {
        ...this.builtIn,
        ...options?.builtIn,
      },
    })

    app.dispatch(setCurrentPage(pageName))

    this._callListener('onAfterPageChange', {
      previousPage: app.getState().page.previousPage,
      next: {
        name: pageName,
        object: cadl?.root?.[pageName],
      },
    } as OnAfterPageChangeArgs)
  }

  /**
   * Returns the link to the main dashboard page by using the noodl base url
   * @param { string } baseUrl - Base url retrieved from the noodl config
   */
  public getDashboardLink(baseUrl: string) {
    const isMeetingConfig = /meeting/i.test(baseUrl)
    const regex = isMeetingConfig ? /(dashboardmeeting|meeting)/i : /dashboard/i
    return cadl?.cadlEndpoint.page.find((name: string) => regex.test(name))
  }

  /** Handles onClick events for "goTo" handling.
   *    Ex: A NOODL page gives an onClick a value of "goToDashboard"
   *     The underlying function here will take a path string and find a matching
   *     page path from the config, and will return the path if found.
   *     Otherwise it will return an empty string
   * @param { null | NOODLConfig } config
   * @return { string }
   */
  public getPagePath(pageName: string) {
    const pages = cadl?.cadlEndpoint?.page || []
    const pagePath = pages.find((name: string) => name.includes(pageName))
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
      let rootId = '',
        node

      if (this.rootNode) {
        rootId = this.rootNode.id

        const { currentPage } = app.getState().page

        // Make sure that the root node we are going to append to is being synced
        if (this.rootNode.id !== currentPage) {
          this.rootNode.id = currentPage
        }

        // Clean up previous nodes
        this.rootNode.innerHTML = ''

        _.forEach(rawComponents, (component) => {
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
    const { previousPage, currentPage } = app.getState().page
    return {
      previousPage,
      currentPage,
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
