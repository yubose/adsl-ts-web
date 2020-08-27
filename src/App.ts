import _ from 'lodash'
import { Viewport } from 'noodl-ui'
import { Account } from '@aitmed/cadl'
import { cadl } from './app/client'
import { setAuthStatus, setRetrievingUserState } from './features/auth'
import { AppDispatch, AppStore, RootState } from './app/types'

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

      return this
    }
  }
}

export default App
