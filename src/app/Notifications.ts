import * as u from '@jsmanifest/utils'
import Logger from 'logsnap'
import { copyToClipboard } from '../utils/dom'
import { FirebaseApp, FirebaseMessaging } from './types'

const log = Logger.create('Notifications.ts')

export interface Options {}

class AppNotification {
  #fb: FirebaseApp | undefined
  #messaging: FirebaseMessaging | undefined
  #supported: boolean | undefined
  #vapidKey = ''
  initiated = false
  workerRegistration: ServiceWorkerRegistration | undefined

  static path = 'firebase-messaging-sw.js'

  async init() {
    try {
      const {
        default: fb,
        aitMessage,
        isSupported,
      } = await import('./firebase')

      this.#supported = isSupported()

      if (this.#supported) {
        this.#fb = fb
        this.#vapidKey = aitMessage.vapidKey
        this.#messaging = fb.messaging()

        this.#messaging.onMessage(
          (obs) => {
            log.func('onMessage<nextOrObserver>')
            log.green('obs', obs)
          },
          (err) => {
            log.func('onMessage<onError>')
            log.red(err.message, err)
          },
          () => {
            log.func('onMessage<onComplete>')
            log.grey(`from onMessage`)
          },
        )
      }

      this.initiated = true
    } catch (error) {
      console.error(error)
    }
  }

  get supported() {
    return this.#supported
  }

  get firebase() {
    return this.#fb
  }

  get messaging() {
    return this.#messaging
  }

  async getMessagingToken(opts?: Record<string, any>) {
    try {
      const token = this.supported
        ? await this.messaging?.getToken({
            vapidKey: this.#vapidKey,
            serviceWorkerRegistration: this.workerRegistration,
            ...opts,
          })
        : ''
      return token || ''
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async register() {
    try {
      this.workerRegistration = await navigator.serviceWorker.register(
        AppNotification.path,
      )
      this.messaging?.onMessage((...args) => {
        log.func('register<messaging.onMessage>')
        log.green(`Received a message`, args)
      })
      return [this.workerRegistration, this.messaging] as const
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

export default AppNotification
