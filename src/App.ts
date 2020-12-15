import _ from 'lodash'
import { Viewport } from 'noodl-ui'
import { AuthStatus } from 'app/types/commonTypes'

class App {
  #isRetrievingUserState: (isRetrieving: boolean) => void = () => {}
  #onAuthStatus: (authStatus: AuthStatus) => void = () => {}
  authStatus: AuthStatus | '' = ''
  getViewport: () => Viewport

  constructor({ viewport }: { viewport: Viewport }) {
    this.getViewport = () => viewport
  }

  public async initialize() {
    const { default: noodl } = await import('app/noodl')
    await noodl.init()

    const startPage = noodl?.cadlEndpoint?.startPage

    if (!this.authStatus) {
      // Initialize the user's state before proceeding to decide on how to direct them
      this.isRetrievingUserState?.(true)
      const { Account } = await import('@aitmed/cadl')
      const storedStatus = await Account.getStatus()
      this.isRetrievingUserState?.(false)

      if (storedStatus.code === 0) {
        noodl.setFromLocalStorage('user')
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
