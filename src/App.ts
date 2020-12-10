import _ from 'lodash'
import Logger from 'logsnap'
import firebase from 'firebase/app'
import { Viewport } from 'noodl-ui'
import { AuthStatus } from 'app/types/commonTypes'

const log = Logger.create('App.ts')

class App {
  #isRetrievingUserState: (isRetrieving: boolean) => void = () => {}
  #onAuthStatus: (authStatus: AuthStatus) => void = () => {}
  authStatus: AuthStatus | '' = ''
  messaging: firebase.messaging.Messaging
  getViewport: () => Viewport

  constructor({
    messaging,
    viewport,
  }: {
    messaging: firebase.messaging.Messaging
    viewport: Viewport
  }) {
    this.getViewport = () => viewport
    this.messaging = messaging
  }

  public async initialize() {
    const { default: noodl } = await import('app/noodl')

    await noodl.init()
    this.initNotifications()

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

  initNotifications() {
    /**
     * Messages are received when
     *  1. Messages are received while the page has focus
     *  2. A notification bubble was clicked on an app notification created
     *    by a service worker `messaging.setBackgroundMessageHandler` handler
     */
    this.messaging.onMessage((payload) => {
      log.func('onMessage')
      log.grey(`Message received`, payload)
    })
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
