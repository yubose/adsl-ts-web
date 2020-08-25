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
} from 'noodl-ui'
import { Account } from '@aitmed/cadl'
import { cadl, noodl } from './app/client'
import { setAuthStatus, setRetrievingUserState } from './features/auth'
import { OnAfterPageChangeArgs, RootState } from './app/types'
import createStore from './app/store'
import Page from './Page'
import builtIn, { videoChat as onVideoChatBuiltIn } from './handlers/builtIns'
import * as action from './handlers/actions'
import * as lifeCycle from './handlers/lifeCycles'

/**
 * The root app instance.
 * In order to synchronize a page's rootNode and nodes, the rootNode is assigned an ID
 * that is equivalent to the current page name that is presented to the user.
 * In addition, the page name on the App instance is always updated whenever a different
 * page is requested
 */

export class App {
  // @ts-expect-error
  private _store: Store<RootState>
  public page: Page
  public viewport: NOODLViewport

  constructor(preloadedState?: RootState) {
    this.viewport = new NOODLViewport()
    this.store = createStore(preloadedState)
    this.page = new Page({
      builtIn: {
        goto: builtIn.goto,
        videoChat: onVideoChatBuiltIn,
      },
    })
  }

  public async initialize() {
    await cadl.init()

    const startPage = cadl?.cadlEndpoint?.startPage
    const store = this.store
    const state = store.getState()
    const authState = state.auth?.status

    if (!authState) {
      // Initialize the user's state before proceeding to decide on how to direct them
      store.dispatch(setRetrievingUserState(true))
      const storedStatus = await Account.getStatus()
      store.dispatch(setRetrievingUserState(false))

      if (storedStatus.code === 0) {
        cadl.setFromLocalStorage('user')
        store.dispatch(setAuthStatus('logged.in'))
      } else if (storedStatus.code === 1) {
        store.dispatch(setAuthStatus('logged.out'))
      } else if (storedStatus.code === 2) {
        store.dispatch(setAuthStatus('new.device'))
      } else if (storedStatus.code === 3) {
        store.dispatch(setAuthStatus('temporary'))
      }

      // Callback which is crucial for components/nodes to be in sync
      if (!this.page.hasListener('onAfterPageChange')) {
        this.page.registerListener(
          'onAfterPageChange',
          async ({ previousPage, next: nextPage }: OnAfterPageChangeArgs) => {
            const logMsg = `%c[App.tsx][onAfterPageChange] ${previousPage} --> ${nextPage.name}`
            const logStyle = `color:#3498db;font-weight:bold;`
            console.log(logMsg, logStyle, { previousPage, nextPage })

            console.log(
              `%c[onPageChange] currentUser.vertex`,
              `color:#3498db};font-weight:bold;`,
              cadl.root?.Global?.currentUser.vertex,
            )

            if (nextPage.name) {
              // Parse the components
              const components = noodl
                // TODO: Leave this binded to the lib
                .setRoot(cadl.root)
                .setPage(nextPage)
                .resolveComponents()
              // Render them to the UI
              this.page.render(components)
            }
          },
        )
      }

      const logMsg = `%c[App.tsx][initialize] startPage`
      const logStyle = `color:#3498db;font-weight:bold;`
      console.log(logMsg, logStyle, startPage)

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
            name: startPage,
            object: cadl.root?.[startPage],
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

      // TODO: Find a way to restore a previous cached page to avoid loading startPage every time
      await this.page.navigate(startPage)

      // Register the register once, if it isn't already registered
      if (this.viewport.onResize === undefined) {
        this.viewport.onResize = (newSizes) => {
          noodl.setViewport(newSizes)
          if (this.page.rootNode) {
            this.page.rootNode.style.width = `${newSizes.width}px`
            this.page.rootNode.style.height = `${newSizes.height}px`
            this.page.render(noodl.resolveComponents())
          } else {
            // TODO
          }
        }
      }

      return this
    }
  }

  public getStore() {
    return this._store
  }

  public getState() {
    return this.store.getState()
  }

  public dispatch(action: any) {
    this._store.dispatch(action)
    return this
  }

  private get store() {
    return this._store
  }

  private set store(store: Store<RootState>) {
    this._store = store
  }
}

const app = new App()

export default app
