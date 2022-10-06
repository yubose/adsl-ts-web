import * as u from '@jsmanifest/utils'
import 'firebase/app'
import 'firebase/auth'
import 'firebase/messaging'
import { firebase as firebaseConfig } from './config'
import firebase from 'firebase/app'
import {
  FirebaseMessaging,
  AppNotificationHook,
  AppNotificationHooks,
  AppNotificationMessageObject,
} from './types'

export interface Options {}

const hooks = new Map<
  AppNotificationHook,
  AppNotificationHooks[AppNotificationHook][]
>()

class AppNotification {
  #unsubscribe: firebase.Unsubscribe | undefined
  client: firebase.app.App | undefined
  initiated = false
  messaging: FirebaseMessaging | undefined;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      enabled: !!this.supported,
      initiated: this.initiated,
    }
  }

  get hooks() {
    return hooks
  }

  get supported() {
    return !!firebase?.messaging?.isSupported?.()
  }

  get unsubscribe() {
    return this.#unsubscribe
  }

  set unsubscribe(unsubscribe) {
    this.#unsubscribe = unsubscribe
  }

  async init() {
    try {
      if (this.supported) {
        this.client = firebase.initializeApp(firebaseConfig.webPatient.config)
        this.messaging = firebase.messaging()

        const onMessageNextOrObserver = (
          obs: firebase.NextFn<any> | firebase.Observer<any, Error>,
        ) => {
          let data = {} as AppNotificationMessageObject

          if (u.isFnc(obs)) {
            data = obs as any
          } else if (u.isObj(obs)) {
            // @ts-expect-error
            data = obs as AppNotificationMessageObject
          }

          this.emit('message', data)
        }

        const onMessageError = (err: Error) => {
          this.emit('error', err)
        }

        const onMessageComplete = () => {
          this.emit('complete')
        }

        this.unsubscribe = this.messaging.onMessage(
          onMessageNextOrObserver,
          onMessageError,
          onMessageComplete,
        )
      }
      this.initiated = true
      this.emit('initiated', this.client as firebase.app.App)
      return this.client
    } catch (error) {
      console.error(error)
      this.emit('initError', error as Error)
    }
  }

  async getToken(
    opts?: Parameters<firebase.messaging.Messaging['getToken']>[0],
  ) {
    let token = ''
    try {
      if (this.supported) {
        opts = { vapidKey: firebaseConfig.webPatient.vapidKey, ...opts }
        token = (await this.messaging?.getToken(opts)) || ''
      }
      this.emit('token', token)
    } catch (error) {
      console.error(error)
    }
    return token
  }

  emit<Hook extends AppNotificationHook>(
    hook: Hook,
    ...args: Parameters<AppNotificationHooks[Hook]>
  ) {
    this.hooks.get(hook)?.forEach?.((fn) => (fn as any)?.(...args))
  }

  on<Hook extends AppNotificationHook>(
    hook: Hook,
    fn: AppNotificationHooks[Hook],
  ) {
    if (!this.hooks.has(hook)) this.hooks.set(hook, [])
    if (!this.hooks.get(hook)?.includes?.(fn)) {
      this.hooks.get(hook)?.push(fn)
    }
    return this
  }
}

export default AppNotification
