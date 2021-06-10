import * as u from '@jsmanifest/utils'
import Logger from 'logsnap'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/messaging'
import {
  FirebaseMessaging,
  AppNotificationHook,
  AppNotificationHooks,
} from './types'

const log = Logger.create('Notifications.ts')

const credentials = {
  apiKey: 'AIzaSyCjNVKmHuDKra5Ct1MKAJ5fI0iQ3UnK7Ho',
  authDomain: 'aitmessage.firebaseapp.com',
  databaseURL: 'https://aitmessage.firebaseio.com',
  projectId: 'aitmessage',
  storageBucket: 'aitmessage.appspot.com',
  messagingSenderId: '121837683309',
  appId: '1:121837683309:web:7fda76efe79928215f3564',
}
const vapidKey =
  'BMVzqbFGARITrYSAi2mPaEMEl6WFBzkliYC8r92Ru3SGtyywC7t4boMPlwnFIeNSEBSyaxV6ue_uo2SMf7rdEHs'

export interface Options {}

const hooks = new Map<
  AppNotificationHook,
  AppNotificationHooks[AppNotificationHook][]
>()

class AppNotification {
  #unsubscribe: firebase.Unsubscribe | undefined
  client: firebase.app.App | undefined
  initiated = false
  messaging: FirebaseMessaging | undefined
  workerRegistration: ServiceWorkerRegistration | undefined

  static path = 'firebase-messaging-sw.js';

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
    return firebase.messaging.isSupported()
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
        this.client = firebase.initializeApp(credentials)
        this.messaging = firebase.messaging()

        const onMessageNextOrObserver = (
          obs: firebase.NextFn<any> | firebase.Observer<any, Error>,
        ) => {
          log.func('onMessage<nextOrObserver>')
          log.green('obs', obs)
          this.emit('message', obs)

          if (u.isFnc(obs)) {
            obs
          } else if (u.isObj(obs)) {
            obs
          }
        }

        const onMessageError = (err: Error) => {
          log.func('onMessage<error>')
          log.red(err.message, err)
          this.emit('error', err)
        }

        const onMessageComplete = () => {
          log.func('onMessage<completed>')
          log.grey(`from onMessage`)
          this.emit('complete')
        }

        this.unsubscribe = this.messaging.onMessage(
          onMessageNextOrObserver,
          onMessageError,
          onMessageComplete,
        )
      }
      this.initiated = true
      this.workerRegistration = await navigator.serviceWorker?.register(
        AppNotification.path,
      )
      this.emit('initiated', this.client as firebase.app.App)
      return this.client
    } catch (error) {
      console.error(error)
      this.emit('initError', error)
    }
  }

  async getToken(opts?: Record<string, any>) {
    try {
      const token =
        (this.supported &&
          (await this.messaging?.getToken({
            vapidKey,
            serviceWorkerRegistration: this.workerRegistration,
            ...opts,
          }))) ||
        ''
      this.emit('token', token)
      return token
    } catch (error) {
      console.error(error)
    }
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
