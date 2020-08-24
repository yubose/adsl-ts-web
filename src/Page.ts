import CADL from '@aitmed/cadl'
import { createBrowserHistory, BrowserHistory, Listener } from 'history'
import _ from 'lodash'
import { cadl } from 'app/client'

export interface PageOptions {
  name?: string
  rootNode?: HTMLElement | null
  nodes?: HTMLElement[] | null
}

/**
 * This Page class is responsible for managing a NOODL page's state that is relative
 * to the page that is being presented to the user, like managing parsed components or
 * action chains that are running.
 */
export class Page {
  public listeners: { [name: string]: Function } = {}
  public history: BrowserHistory
  public name: string
  public rootNode: HTMLElement | null
  public nodes: HTMLElement[] | null

  constructor({ name = '', rootNode = null, nodes = null }: PageOptions = {}) {
    this.history = createBrowserHistory()
    this.name = name
    this.rootNode = rootNode
    this.nodes = nodes
  }

  public async initializePage(...args: Parameters<CADL['initPage']>) {
    const [pageName, arr = [], options] = args
    await cadl.initPage(pageName, arr, {
      builtIn: {
        goto: () => console.log('builtIn goto invoked'),
      },
      ...options,
    })
  }

  public initializeRoute() {
    // TODO: get the current page the user is on (router?)
    // Handle redirection in case of expired tokens or invalid auth state
    return this
  }

  public registerListener(listenerName: string, listener: Listener) {
    if (!_.isFunction(this.listeners[listenerName])) {
      this.listeners[listenerName] = listener
      this.history.listen(listener)
    } else {
      const logMsg = `%cAn existing listener named ${listenerName} was already registered. It will be removed and replaced with this one`
      const logStyle = `color:#ec0000;font-weight:bold;`
      console.log(logMsg, logStyle)
    }
    return this
  }

  public hasListener(listenerName: string) {
    return _.isFunction(this.listeners[listenerName])
  }
}

export default Page
