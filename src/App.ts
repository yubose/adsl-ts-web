import _ from 'lodash'
import { Store } from '@reduxjs/toolkit'
import {
  getElementType,
  getAlignAttrs,
  getBorderAttrs,
  getCustomDataAttrs,
  getChildren,
  getColors,
  getEventHandlers,
  getFontAttrs,
  getPosition,
  getReferences,
  getStylesByElementType,
  getSizes,
  getTransformedAliases,
  getTransformedStyleAliases,
  NOODLViewport,
  NOODLComponent,
} from 'noodl-ui'
import { Account } from '@aitmed/cadl'
import { toDOMNode } from 'utils/noodl'
import { cadl, noodl } from 'app/client'
import { setAuthStatus, setRetrievingUserState } from 'features/auth'
import { RootState } from 'app/types'
import createStore from 'app/store'
import builtIn from 'handlers/builtIns'
import * as action from 'handlers/actions'
import * as lifeCycle from 'handlers/lifeCycles'
import Page from './Page'

/**
 * The root app instance.
 * In order to synchronize a page's rootNode and nodes, the rootNode is assigned an ID
 * that is equivalent to the current page name that is presented to the user.
 * In addition, the page name on the App instance is always updated whenever a different
 * page is requested
 */

export class App {
  private _initializeRootNode: () => App
  private _getRootNode: (() => HTMLElement) | undefined
  private _rootNodeExists: (() => boolean) | undefined
  private _initializeStore: () => Store<RootState>
  public getStore: (() => Store<RootState>) | undefined
  public getState: (() => RootState) | undefined
  public page: Page
  public viewport: NOODLViewport
  public userState:
    | 'logged.in'
    | 'logged.out'
    | 'new.device'
    | 'temporary'
    | null = null

  constructor() {
    this.viewport = new NOODLViewport()
    this.page = new Page()

    this._initializeStore = (preloadedState?: any) => {
      if (_.isFunction(this.getStore)) {
        return this.getStore()
      }
      const store = createStore(preloadedState)
      // Expose helpers to retrieve the store and its state
      this.getStore = () => store
      this.getState = () => store.getState()
      return store
    }

    this._initializeRootNode = () => {
      const root = document.createElement('div')
      root.id = 'root'
      root.style.position = 'absolute'
      root.style.width = '100%'
      root.style.height = '100%'

      this.page.rootNode = root

      document.body.appendChild(root)

      // Expose helpers to reference/manage the root node
      this._getRootNode = () => root
      this._rootNodeExists = () => document.body.contains(root)

      return this
    }
  }

  public async initialize() {
    await cadl.init()

    const store = this._initializeStore()
    const state = store.getState()
    const authState = state.auth.status

    if (authState === null) {
      // Initialize the user's state before proceeding to decide on how to direct them
      store.dispatch(setRetrievingUserState(true))
      const storedStatus = await Account.getStatus()
      store.dispatch(setRetrievingUserState(false))
      store.dispatch(setAuthStatus(storedStatus as any))

      if (storedStatus.code === 0) {
        cadl.setFromLocalStorage('user')
      }
      // Initialize the route to handle necessary redirections in case of invalid token or auth creds

      if (storedStatus.code === 0) {
        // TODO
      } else if (storedStatus.code === 1) {
        // TODO
      } else if (storedStatus.code === 2) {
        // TODO
      }
    }

    // Callback which is crucial for components/nodes to be in sync
    if (!this.page.hasListener('onPageChange')) {
      this.page.registerListener('onPageChange', ({ action, location }) => {
        const logMsg = `%c[App.tsx][onPageChange] Page changed`
        const logStyle = `color:#3498db;font-weight:bold;`
        console.log(logMsg, logStyle, { action, location })
      })
    }

    const currentPage = 'SignIn' // TEMP
    await this.page.initializePage(currentPage)

    // Initialize the NOODL client / component resolver
    if (!noodl.initialized) {
      noodl
        .init({ viewport: this.viewport })
        .setRoot(cadl.root)
        .setAssetsUrl(cadl.assetsUrl || '')
        .setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
        })
        .setPage({
          name: 'SignIn',
          object: cadl.root.SignIn,
        })
        .setResolvers([
          getElementType,
          getTransformedAliases,
          getReferences,
          getAlignAttrs,
          getBorderAttrs,
          getColors,
          getFontAttrs,
          getPosition,
          getSizes,
          getStylesByElementType,
          getTransformedStyleAliases,
          getChildren,
          getCustomDataAttrs,
          getEventHandlers,
        ])
        .addLifecycleListener({
          action: {
            evalObject: action.onEvalObject,
            goto: action.onGoto,
            pageJump: action.onPageJump,
            popUp: action.onPopUp,
            popUpDismiss: action.onPopUpDismiss,
            refresh: action.onRefresh,
            saveObject: action.onSaveObject,
            updateObject: action.onUpdateObject,
          },
          builtIn: {
            checkUsernamePassword: builtIn.checkUsernamePassword,
            enterVerificationCode: builtIn.checkVerificationCode,
            goBack: builtIn.goBack,
            lockApplication: builtIn.lockApplication,
            logOutOfApplication: builtIn.logOutOfApplication,
            logout: builtIn.logout,
            signIn: builtIn.signIn,
            signUp: builtIn.signUp,
            signout: builtIn.signout,
            toggleCameraOnOff: builtIn.toggleCameraOnOff,
            toggleMicrophoneOnOff: builtIn.toggleMicrophoneOnOff,
          },
          onChainStart: lifeCycle.onChainStart,
          onChainEnd: lifeCycle.onChainEnd,
          onChainError: lifeCycle.onChainError,
          onChainAborted: lifeCycle.onChainAborted,
          onAfterResolve: lifeCycle.onAfterResolve,
        } as any)
    }

    // Register the register once, if it isn't already registered
    if (this.viewport.onResize === undefined) {
      this.viewport.onResize = (newSizes) => {
        noodl.setViewport(newSizes)
        const rootNode = this._getRootNode?.()

        if (rootNode) {
          rootNode.style.width = `${newSizes.width}px`
          rootNode.style.height = `${newSizes.height}px`
          const components = noodl.resolveComponents()
          this.render(components)
        } else {
          // TODO
        }
      }
    }

    if (!this._rootNodeExists?.()) {
      this._initializeRootNode()
    }

    return this
  }

  /**
   * Takes a list of raw NOODL components and converts them into DOM nodes and appends
   * them to the DOM
   * @param { NOODLUIPage } page - Page in the shape of { name: string; object: null | NOODLPageObject }
   */
  public render(rawComponents: NOODLComponent[]) {
    window.components = rawComponents

    if (_.isArray(rawComponents)) {
      let rootId = '',
        node

      const rootNode = this.page.rootNode as HTMLElement

      if (this.page.rootNode) {
        rootId = rootNode.id
      } else {
        const logMsg = `%cAttempted to render the page's components but the root node was not initialized. The page will not show anything`
        const logStyle = `color:#ec0000;font-weight:bold;`
        console.log(logMsg, logStyle, this.page)
      }

      // Make sure that the root node we are going to append to is being synced
      if (rootId !== this.page.name) {
        // TODO: Apply a history
        rootNode.id = rootId
      }

      // Clean up previous nodes
      rootNode.innerHTML = ''

      _.forEach(rawComponents, (component) => {
        node = toDOMNode(component)
        if (node) {
          rootNode.appendChild(node)
        }
      })
    } else {
      // TODO
    }

    return this
  }
}

const app = new App()

export default app
