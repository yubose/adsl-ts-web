import _ from 'lodash'
import { Viewport } from 'noodl-ui'
import { cadl } from './app/client'
import { AuthStatus } from 'app/types/commonTypes'

class App {
  #onAuthStatus: (authStatus: AuthStatus) => void = () => {}
  #isRetrievingUserState: (isRetrieving: boolean) => void = () => {}
  authStatus: AuthStatus | '' = ''
  getStatus: () => Promise<{ code: number }>
  getViewport: () => Viewport

  constructor({
    getStatus,
    viewport,
  }: {
    getStatus: () => Promise<any>
    viewport: Viewport
  }) {
    this.getViewport = () => viewport
    this.getStatus = () => Promise.resolve(getStatus())
  }

  public async initialize() {
    await cadl.init()

    const startPage = cadl?.cadlEndpoint?.startPage

    if (!this.authStatus) {
      // Initialize the user's state before proceeding to decide on how to direct them
      this.isRetrievingUserState?.(true)
      const storedStatus = await this.getStatus()
      this.isRetrievingUserState?.(false)

      if (storedStatus.code === 0) {
        cadl.setFromLocalStorage('user')
        this.authStatus = 'logged.in'
        this.onAuthStatus?.('logged.in')
      } else if (storedStatus.code === 1) {
        this.authStatus = 'logged.out'
        this.onAuthStatus?.('logged.out')
      } else if (storedStatus.code === 2) {
        this.authStatus = 'new.device'
        this.onAuthStatus?.('new.device')
      } else if (storedStatus.code === 3) {
        this.authStatus = 'temporary'
        this.onAuthStatus?.('temporary')
      }
    }

    return {
      startPage,
    }
  }

  get onAuthStatus() {
    return this.#onAuthStatus
  }

  set onAuthStatus(fn) {
    this.#onAuthStatus = fn
  }

  get isRetrievingUserState() {
    return this.#isRetrievingUserState
  }

  set isRetrievingUserState(fn) {
    this.#isRetrievingUserState = fn
  }
}

export default App
