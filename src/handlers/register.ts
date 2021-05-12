// These callbacks are to handle components of type "register"
// TEMP: "Register" components that operate with "emit" objects
// are currently handled in App.ts

import Logger from 'logsnap'
import * as u from '@jsmanifest/utils'
import { Identify, PageObject } from 'noodl-types'
import { Room } from 'twilio-video'
import { Register } from 'noodl-ui'
import { copyToClipboard } from '../utils/dom'
import { mapEntries } from '../utils/common'
import App from '../App'

const log = Logger.create('register.ts')

function createRegisters(app: App) {
  function onInitPage(pageObject: PageObject) {
    if (app?.root?.Global?.globalRegister) {
      const GlobalRoot = app.root.Global as Record<string, any>
      const globalRegister = GlobalRoot.globalRegister
      if (u.isArr(globalRegister)) {
        log.func('onInitPage')
        for (const obj of globalRegister) {
          log.grey(
            `Scanning ${globalRegister.length} items found in globalRegister`,
            globalRegister,
          )
          globalRegister.forEach((component: Record<string, any>) => {
            if (Identify.component.register(component)) {
              // Already attached a function
              if (u.isFnc(component.onEvent)) return
              if (!component.onEvent) {
                return log.red(
                  `The "onEvent" identifier was not found in the register component!`,
                  component,
                )
              }
              app.nui.use({ register: component })
              const register = app.nui.cache.register.get(
                component.onEvent as string,
              )
              if (register) {
                log.green(
                  `Received register object for event "${register.name}"`,
                  { register, component },
                )
                if (u.isFnc(register.fn)) {
                  log.green(
                    `Attaching the default noodl-ui register function on the register component in the root object`,
                    { register, component },
                  )
                  component.onEvent = register.fn.bind(register) as any
                } else if (!register.handler) {
                  log.red(
                    `Alert! A register object was returned but the "fn" value was not a function and the "handler" object was empty!`,
                    { register, component },
                  )
                }
              } else {
                log.red(
                  `Alert! The register component of event "${component.onEvent}" was sent to noodl-ui but nothing was returned`,
                  { register, component },
                )
              }
            }
          })
        }
      }
    }
  }

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
          app._store.messaging.serviceRegistration =
            await navigator.serviceWorker.register('firebase-messaging-sw.js')
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
    twilioOnPeopleJoin(obj: Register.Object, params: { room?: Room } = {}) {
      console.log(`%c[twilioOnPeopleJoin]`, `color:#95a5a6;`, {
        register: obj,
        params,
      })
      app.meeting.hideWaitingOthersMessage()
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

  if (u.isFnc(app.listen)) {
    app.listen('onInitPage', onInitPage)
  } else {
    console.info(
      `%cThe "listen" method on App was skipped because it was undefined`,
      'color:red;font-weight:bold',
    )
  }

  return u.entries(o)
}

export default createRegisters
