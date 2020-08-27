import _ from 'lodash'
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
  Viewport,
} from 'noodl-ui'
import { Account } from '@aitmed/cadl'
import { cadl, noodl } from './app/client'
import { setAuthStatus, setRetrievingUserState } from './features/auth'
import { AppDispatch, AppStore, RootState } from './app/types'
import builtIn from './handlers/builtIns'
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
  public getStore: () => AppStore
  public getState: () => RootState
  public getViewport: () => Viewport
  public dispatch: AppDispatch

  constructor({ store, viewport }: { store: AppStore; viewport: Viewport }) {
    this.getStore = (): AppStore => store
    this.getState = store.getState
    this.getViewport = () => viewport
    this.dispatch = store.dispatch
  }

  public async initialize() {
    await cadl.init()

    const startPage = cadl?.cadlEndpoint?.startPage
    const state = this.getState()
    const authState = state.auth?.status
    const viewport = this.getViewport()

    if (!authState) {
      // Initialize the user's state before proceeding to decide on how to direct them
      this.dispatch(setRetrievingUserState(true))
      const storedStatus = await Account.getStatus()
      this.dispatch(setRetrievingUserState(false))

      if (storedStatus.code === 0) {
        cadl.setFromLocalStorage('user')
        this.dispatch(setAuthStatus('logged.in'))
      } else if (storedStatus.code === 1) {
        this.dispatch(setAuthStatus('logged.out'))
      } else if (storedStatus.code === 2) {
        this.dispatch(setAuthStatus('new.device'))
      } else if (storedStatus.code === 3) {
        this.dispatch(setAuthStatus('temporary'))
      }

      const logMsg = `%c[App.tsx][initialize] startPage`
      const logStyle = `color:#3498db;font-weight:bold;`
      console.log(logMsg, logStyle, startPage)

      // Initialize the NOODL client / component resolver
      if (!noodl.initialized) {
        noodl
          .init({ viewport })
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
      return this
    }
  }
}

export default App
