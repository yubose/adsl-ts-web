// These callbacks are to handle components of type "register"
// TEMP: "Register" components that operate with "emit" objects
// are currently handled in App.ts

import Logger from 'logsnap'
import { Room } from 'twilio-video'
import { Register } from 'noodl-ui'
import { copyToClipboard } from '../utils/dom'
import App from '../App'
import * as u from '../utils/common'

const log = Logger.create('register.ts')

function createRegisters(app: App) {
  const o = {
    async FCMOnTokenReceive(
      obj: Register.Object,
      { options }: { options?: Record<string, any> } = {},
    ) {
      log.func('FCMOnTokenReceive')
      log.grey('', obj)
      try {
        const permission = await Notification.requestPermission()
        log.func('messaging.requestPermission')
        log.grey(`Notification permission ${permission}`)
      } catch (err) {
        log.func('messaging.requestPermission')
        log.red('Unable to get permission to notify.', err)
      }
      try {
        if (app.getFirebaseState().enabled) {
          app._store.messaging.serviceRegistration = await navigator.serviceWorker.register(
            'firebase-messaging-sw.js',
          )
          log.grey(
            'Initialized service worker',
            app._store.messaging.serviceRegistration,
          )

          app.messaging?.onMessage((...args) => {
            log.func('app._store.messaging.onMessage')
            log.green(`Received a message`, args)
          })
        } else {
          log.func('FCMOnTokenReceive')
          log.red(
            `Could not emit the "FCMOnTokenReceive" event because firebase ` +
              `messaging is disabled. Is it supported by app browser?`,
            app,
          )
        }

        const getTokenOptions = {
          vapidKey: app._store.messaging.vapidKey,
          serviceWorkerRegistration: app._store.messaging.serviceRegistration,
          ...options,
        }

        const token = app.getFirebaseState().enabled
          ? (await app.messaging?.getToken(getTokenOptions)) || ''
          : ''

        copyToClipboard(token)

        return token
      } catch (error) {
        console.error(error)
        return error
      }
    },
    twilioOnPeopleJoin(obj: Register.Object, { room }: { room?: Room } = {}) {
      console.log(`%c[twilioOnPeopleJoin]`, `color:#95a5a6;`, obj)
      if (room?.participants.size) {
        app.meeting.hideWaitingOthersMessage()
      }
    },
    twilioOnNoParticipant(
      obj: Register.Object,
      { room }: { room?: Room } = {},
    ) {
      console.log(`%c[twilioOnNoParticipant]`, `color:#95a5a6;`, obj)
      if (room?.participants?.size === 0) {
        app.meeting.showWaitingOthersMessage()
      }
    },
  } as const

  return u.mapEntries((name, fn) => ({ name, fn }), o)
}

export default createRegisters
