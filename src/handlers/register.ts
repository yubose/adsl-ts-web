// These callbacks are to handle components of type "register"
// TEMP: "Register" components that operate with "emit" objects
// are currently handled in App.ts

import Logger from 'logsnap'
import * as u from '@jsmanifest/utils'
import { EmitObject, EmitObjectFold, Identify, PageObject } from 'noodl-types'
import { Room } from 'twilio-video'
import { createAction, NUIComponent, Register } from 'noodl-ui'
import { copyToClipboard } from '../utils/dom'
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
              if (component.onEvent === 'FCMOnTokenReceive') {
                const instance = app.nui.resolveComponents(
                  component,
                ) as NUIComponent.Instance
                const action = createAction({
                  action: {
                    emit: component.emit as EmitObject,
                    actionType: 'register',
                  },
                  trigger: 'register',
                })

                component.onEvent = async function FCMOnTokenReceive(
                  token: string,
                ) {
                  try {
                    action.dataKey = { var: token }
                    debugger
                    await Promise.all(
                      app.actions.emit.get('register')?.map((obj) =>
                        obj?.fn?.(
                          action,
                          app.nui.getConsumerOptions({
                            component: instance,
                            page: app.mainPage,
                          }),
                        ),
                      ) || [],
                    )
                    debugger
                    return token
                  } catch (error) {
                    console.error(error)
                    // throw error
                  }
                }

                app.notification?.getMessagingToken().then(async (token) => {
                  log.func('FCMOnTokenReceive')
                  log.gold(`FCMOnTokenReceive`, token)
                  await component.onEvent?.(token)
                  // app.nui._experimental.register(component, {
                  //   name: 'FCMOnTokenReceive',
                  //   params: token,
                  //   handler: {
                  //   async fn() {

                  //   },
                  //   useReturnValue: true}
                  //                 } as Register.Object)
                  // const results = await ac.execute()
                })
              } else {
                app.nui.use({ register: component })
                const register = app.nui.cache.register.get(
                  component.onEvent as string,
                )
                if (register) {
                  if (u.isFnc(register.fn)) {
                    component.onEvent = register.fn.bind(register) as any
                    log.grey(
                      `A function was attached on the "onEvent" property`,
                      { register, component },
                    )
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
      log.hotpink('', obj)
      try {
        const permission = await Notification.requestPermission()
        log.func('messaging.requestPermission')
        log.grey(`Notification permission ${permission}`)
      } catch (err) {
        log.func('messaging.requestPermission')
        log.red('Unable to get permission to notify.', err)
      }
      try {
        if (app.notification?.supported) {
          log.grey(
            'Initialized service worker',
            await app.notification.register(),
          )
        } else {
          log.red(
            `Could not emit the "FCMOnTokenReceive" event because firebase ` +
              `messaging is disabled. Is it supported by app browser?`,
            app,
          )
        }
        const token = await app.notification?.getMessagingToken()
        copyToClipboard(token as string)
        return token
      } catch (error) {
        console.error(error)
        return error
      }
    },
    async onNewEcosDoc(obj: Register.Object) {
      log.func('onNewEcosDoc')
      log.gold('', arguments)
      log.gold('', arguments)
      log.gold('', arguments)
      log.gold('', arguments)
      log.gold('', arguments)
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
