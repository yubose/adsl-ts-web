import * as u from '@jsmanifest/utils'
import Logger from 'logsnap'
import { Identify, PageObject } from 'noodl-types'
import {
  createAction,
  EmitAction,
  NuiComponent,
  Register,
  Store,
} from 'noodl-ui'
import App from '../App'
import { copyToClipboard } from '../utils/dom'
import { GlobalRegisterComponent } from '../app/types'

type Room = any

const log = Logger.create('register.ts')

function createRegisters(app: App) {
  app.notification?.on('message', (message) => {
    if (message) {
      const { data } = message
      if (data?.did) {
        //  call onNewEcosDoc for now  until we propose a more generic approach
        const onNewEcosDocRegisterComponent = app.globalRegister?.find?.(
          (obj) => obj?.eventId === 'onNewEcosDoc',
        )
        onNewEcosDocRegisterComponent?.onEvent?.(data.did)
      }
    }
  })

  const registerHandlers = {
    onNewDocument() {
      //
    },
    onNewMessage() {
      //
    },
    onNewMeetingInvite() {
      //
    },
  }

  const registrees = {
    async FCMOnTokenReceive(componentObject: GlobalRegisterComponent) {
      log.func('FCMOnTokenReceive')

      componentObject.eventId = 'FCMOnTokenReceive'

      const action = createAction({
        action: { emit: componentObject.emit, actionType: 'register' },
        trigger: 'register',
      }) as EmitAction

      const component = (await app.nui?.resolveComponents(
        componentObject,
      )) as NuiComponent.Instance

      componentObject.onEvent = async function FCMOnTokenReceive(
        token: string,
      ) {
        try {
          action.dataKey = { var: token }
          await Promise.all(
            app.actions?.emit.get('register')?.map((obj: Store.ActionObject) =>
              obj?.fn?.(
                action,
                app.nui?.getConsumerOptions({
                  component,
                  page: app.mainPage?.getNuiPage(),
                }),
              ),
            ) || [],
          )
          return token
        } catch (error) {
          console.error(error)
        }
      }

      app.notification
        ?.getToken()
        .then(async (token) => {
          log.grey(token)
          await componentObject.onEvent?.(token)
        })
        .catch((err) => log.red(`[Error]: ${err.message}`))
    },
    async onNewEcosDoc(componentObject: GlobalRegisterComponent) {
      log.func('onNewEcosDoc')

      componentObject.eventId = 'onNewEcosDoc'

      const action = createAction({
        action: { emit: componentObject.emit, actionType: 'register' },
        trigger: 'register',
      }) as EmitAction

      const component = (await app.nui?.resolveComponents(
        componentObject,
      )) as NuiComponent.Instance

      componentObject.onEvent = async function onNewEcosDoc(did: string) {
        log.func('onNewEcosDoc onEvent')
        log.gold(``, did)
        try {
          action.dataKey = { var: did }
          await Promise.all(
            app.actions?.emit.get('register')?.map((obj: Store.ActionObject) =>
              obj?.fn?.(
                action,
                app.nui?.getConsumerOptions({
                  component,
                  page: app.mainPage?.getNuiPage(),
                }),
              ),
            ) || [],
          )
          return did
        } catch (error) {
          console.error(error)
        }
      }
    },
    async onNewMeetingInvite(componentObject: GlobalRegisterComponent) {
      log.func('onNewMeetingInvite')
      componentObject.eventId = 'onNewMeetingInvite'
    },
  }

  function onInitPage(pageObject: PageObject) {
    if (app.globalRegister) {
      log.func('onInitPage')

      for (const componentObject of app.globalRegister) {
        if (Identify.component.register(componentObject)) {
          // Already attached a function
          if (u.isFnc(componentObject.onEvent)) continue
          if (!componentObject.onEvent) {
            log.red(
              `The "onEvent" identifier was not found in the register component!`,
              componentObject,
            )
            continue
          }

          if (
            u.isStr(componentObject.onEvent) &&
            u.isFnc(registrees[componentObject.onEvent])
          ) {
            const onEvent = componentObject.onEvent as any
            ;(registrees as any)[onEvent](componentObject)
          } else {
            // This block runs if the event is not in registrees
            app.nui.use({ register: componentObject })

            log.func('onInitPage')
            log.orange(
              `The register component "${componentObject.onEvent}" is not handled in the app yet`,
              componentObject,
            )

            const register = app.nui.cache.register.get(
              componentObject.onEvent as string,
            )

            if (register) {
              if (u.isFnc(register.fn)) {
                componentObject.onEvent = register.fn.bind(register) as any
                log.grey(`A function was attached on the "onEvent" property`, {
                  register,
                  component: componentObject,
                })
              } else if (!register.handler) {
                log.red(
                  `Alert! A register object was returned but the "fn" value was not a function and the "handler" object was empty!`,
                  { componentObject, register },
                )
              }
            } else {
              log.red(
                `Alert! The register component of event "${componentObject.onEvent}" was sent to noodl-ui but nothing was returned`,
                componentObject,
              )
            }
          }
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
        } else {
          log.red(
            `Could not emit the "FCMOnTokenReceive" event because firebase ` +
              `messaging is disabled. Is it supported by app browser?`,
            app,
          )
        }
        const token = await app.notification?.getToken()
        copyToClipboard(token as string)
        return token
      } catch (error) {
        console.error(error)
        return error
      }
    },
    twilioOnPeopleJoin(obj: Register.Object, params: { room?: Room } = {}) {
      log.func('twilioOnPeopleJoin')
      log.grey(`%c[twilioOnPeopleJoin]`, `color:#95a5a6;`, {
        register: obj,
        params,
      })
      app.meeting.hideWaitingOthersMessage()
    },
    twilioOnNoParticipant(
      obj: Register.Object,
      { room }: { room?: Room } = {},
    ) {
      log.func('twilioOnNoParticipant')
      log.grey(`%c[twilioOnNoParticipant]`, `color:#95a5a6;`, obj)
      if (room?.participants?.size === 0) {
        app.meeting.showWaitingOthersMessage()
      }
    },
  } as const

  if (u.isFnc(app.listen)) {
    app.listen('onInitPage', onInitPage)
  } else {
    console.log(
      `%cThe "listen" method on App was skipped because it was undefined`,
      'color:red;font-weight:bold',
    )
  }

  return u.entries(o)
}

export default createRegisters
