import _ from 'lodash'
import { Viewport } from 'noodl-ui'
import { cadl } from './app/client'
import { setAuthStatus, setRetrievingUserState } from './features/auth'
import { AppDispatch, AppStore, RootState } from './app/types'

export class App {
  public getStore: () => AppStore
  public getState: () => RootState
  public getStatus: () => Promise<{ code: number }>
  public getViewport: () => Viewport
  public dispatch: AppDispatch

  constructor({
    getStatus,
    store,
    viewport,
  }: {
    getStatus: () => Promise<any>
    store: AppStore
    viewport: Viewport
  }) {
    this.getStore = (): AppStore => store
    this.getState = store.getState
    this.getViewport = () => viewport
    this.getStatus = () => Promise.resolve(getStatus())
    this.dispatch = store.dispatch
  }

  public async initialize() {
    await cadl.init()

    const state = this.getState()
    const authState = state.auth?.status
    const startPage = cadl?.cadlEndpoint?.startPage

    if (!authState) {
      // Initialize the user's state before proceeding to decide on how to direct them
      this.dispatch(setRetrievingUserState(true))
      const storedStatus = await this.getStatus()
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
    }

    return {
      startPage,
    }
  }
}

export default App
