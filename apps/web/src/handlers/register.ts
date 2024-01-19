import * as u from '@jsmanifest/utils'
import log from '../log'
import {
  createAction,
  EmitAction,
  NuiComponent,
  Register,
  Store,
} from 'noodl-ui'
import App from '../App'
import { copyToClipboard } from '../utils/dom'
import is from '../utils/is'
import { GlobalRegisterComponent } from '../app/types'
const registerEvents = {
  onNewMeetingInvite: 'onNewMeetingInvite',
  onDisconnect: 'onDisconnect',
  showExtendView: 'showExtendView',
  onProviderDisconnect: 'onProviderDisconnect',
  showExitWarningView: 'showExitWarningView',
  twilioOnPeopleJoin: 'twilioOnPeopleJoin',
  codeTask: 'codeTask',
  twilioOnPeopleShowRoom: 'twilioOnPeopleShowRoom',
  recordingStarted: 'recordingStarted',
  recordingStopped:'recordingStopped',

}
interface RegisterHooks {
  onNewMeetingInvite(onEvent:string): void
  onDisconnect(onEvent:string): void
  showExtendView(onEvent:string): void
  onProviderDisconnect(onEvent:string): void
  showExitWarningView(onEvent:string): void
  twilioOnPeopleJoin(onEvent:string): void
  codeTask(onEvent:string): void
  twilioOnPeopleShowRoom(onEvent:string): void
}
type RegisterHook = keyof RegisterHooks

class createRegisters {
  app: App
  o: Record<string, any>
  registrees: Record<string, any>
  #numberofExtensions: number = 0
  #timePerExtendSeconds: number = 0
  #popUpWaitSeconds: number = 30
  #meetingEndTime: number = 0
  public timeId: Record<string, any>[] = []
  hooks = new Map<RegisterHook,RegisterHooks[RegisterHook][]>()

  set numberofExtensions(value:number){
    this.#numberofExtensions = value
  }
  get numberofExtensions(){
    return this.#numberofExtensions
  }
  set popUpWaitSeconds(value:number){
    this.#popUpWaitSeconds = value
  }
  get popUpWaitSeconds(){
    return this.#popUpWaitSeconds
  }
  set timePerExtendSeconds(value:number){
    this.#timePerExtendSeconds = value
  }
  get timePerExtendSeconds(){
    return this.#timePerExtendSeconds
  }

  set meetingEndTime(value:number){
    this.#meetingEndTime = value
  }
  get meetingEndTime(){
    return this.#meetingEndTime
  }

  constructor(app: App) {
    this.app = app

    this.o = {
      async FCMOnTokenReceive(
        obj: Register.Object,
        { options }: { options?: Record<string, any> } = {},
      ) {
        try {
          const permission = await Notification.requestPermission()
          log.debug(`Notification permission ${permission}`)
        } catch (err) {
          log.error('Unable to get permission to notify.', err)
        }
        try {
          if (app.notification?.supported) {
          } else {
            log.error(
              `Could not emit the "FCMOnTokenReceive" event because firebase ` +
                `messaging is disabled. Is it supported by app browser?`,
              app,
            )
          }
          const token = await app.notification?.getToken({
            serviceWorkerRegistration:
              app.serviceWorkerRegistration as ServiceWorkerRegistration,
          })
          copyToClipboard(token as string)
          return token
        } catch (error) {
          log.error(error)
          return error
        }
      },
      // twilioOnPeopleJoin(obj: Register.Object, params: { room?: Room } = {}) {
      //   log.func('twilioOnPeopleJoin')
      //   log.debug(`%c[twilioOnPeopleJoin]`, `color:#95a5a6;`, {
      //     register: obj,
      //     params,
      //   })
      //   app.meeting.hideWaitingOthersMessage()
      // },
      // twilioOnNoParticipant(
      //   obj: Register.Object,
      //   { room }: { room?: Room } = {},
      // ) {
      //   log.func('twilioOnNoParticipant')
      //   log.debug(`%c[twilioOnNoParticipant]`, `color:#95a5a6;`, obj)
      //   if (room?.participants?.size === 0) {
      //     app.meeting.showWaitingOthersMessage()
      //   }
      // },

      async twilioOnPeopleShowRoom(obj: Register.Object, arg) {
        // debugger
      },
    }

    

    this.registrees = {
      async FCMOnTokenReceive(componentObject: GlobalRegisterComponent) {
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
            //trigger emit
            action.dataKey = { var: token }
            await Promise.all(
              app.actions?.emit
                .get('register')
                ?.map((obj: Store.ActionObject) =>
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
            log.error(error)
          }
        }

        app.notification
          ?.getToken({
            serviceWorkerRegistration:
              app.serviceWorkerRegistration as ServiceWorkerRegistration,
          })
          .then(async (token) => {
            log.debug('', {
              token,
              serviceWorkerRegistration: app.serviceWorkerRegistration,
            })
            await componentObject.onEvent?.(token)
          })
          .catch((err) => {
            log.error(`[Error]: ${err.message}`)
          })
      },
      async onNewEcosDoc(componentObject: GlobalRegisterComponent) {
        componentObject['eventId']= 'onNewEcosDoc'

        const action = createAction({
          action: { emit: componentObject.emit, actionType: 'register' },
          trigger: 'register',
        }) as EmitAction

        const component = (await app.nui?.resolveComponents(
          componentObject,
        )) as NuiComponent.Instance

        componentObject.onEvent = async function onNewEcosDoc(did: string) {
          try {
            action.dataKey = { var: did }
            const options = app.nui?.getConsumerOptions({
              component,
              page: app.mainPage?.getNuiPage(),
            })
            const result = await Promise.all(
              app.actions?.emit
                .get('register')
                ?.map((obj: Store.ActionObject) =>
                  obj?.fn?.(
                    action,
                    options,
                  ),
                ) || [],
            )
            if (result) {

              const results = u.array(result)
              while (results.length) {
                let result = results.pop()
                while (u.isArr(result)) {
                  results.push(...result)
                  result = results.pop()
                }
                
                const action = result
                try {
                  const actionTypeKeys = [
                    'popUp',
                    'popUpDismiss',
                    'toast',
                    'getLocationAddress',
                    'pageJump',
                    'refresh',
                  ]
                  if (
                    action?.['actionType'] &&
                    actionTypeKeys.includes(action?.['actionType'])
                  ) {
                    const newAction = createAction({
                      action: action,
                      trigger: 'register',
                    })
                    const type = action?.['actionType']
                    const actionFn = app.root.actions[type]
                    u.isFnc(actionFn) &&
                      (await actionFn?.(
                        newAction,
                        options
                      ))
                  }else if(action?.['goto']){
                    const fn = app.root.builtIn.goto
                    await fn?.(action['goto'])
                    break
                  }
                  
                } catch (error) {
                  log.error(error)
                }
               
              }
            }
            return did
          } catch (error) {
            log.error(error)
          }
        }
      },
      async onRejected(componentObject: GlobalRegisterComponent) {
        componentObject['eventId']= 'onRejected'

        const action = createAction({
          action: { emit: componentObject.emit, actionType: 'register' },
          trigger: 'register',
        }) as EmitAction

        const component = (await app.nui?.resolveComponents(
          componentObject,
        )) as NuiComponent.Instance

        componentObject.onEvent = async function onNewEcosDoc(did: string) {
          try {
            const options = app.nui?.getConsumerOptions({
              component,
              page: app.mainPage?.getNuiPage(),
            })
            const result = await Promise.all(
              app.actions?.emit
                .get('register')
                ?.map((obj: Store.ActionObject) =>
                  obj?.fn?.(
                    action,
                    options,
                  ),
                ) || [],
            )
            if (result) {

              const results = u.array(result)
              while (results.length) {
                let result = results.pop()
                while (u.isArr(result)) {
                  results.push(...result)
                  result = results.pop()
                }
                
                const action = result
                try {
                  const actionTypeKeys = [
                    'popUp',
                    'popUpDismiss',
                    'toast',
                    'getLocationAddress',
                    'pageJump',
                    'refresh',
                  ]
                  if (
                    action?.['actionType'] &&
                    actionTypeKeys.includes(action?.['actionType'])
                  ) {
                    const newAction = createAction({
                      action: action,
                      trigger: 'register',
                    })
                    const type = action?.['actionType']
                    const actionFn = app.root.actions[type]
                    u.isFnc(actionFn) &&
                      (await actionFn?.(
                        newAction,
                        options
                      ))
                  }else if(action?.['goto']){
                    const fn = app.root.builtIn.goto
                    await fn?.(action['goto'])
                    break
                  }
                  
                } catch (error) {
                  log.error(error)
                }
               
              }
            }
            return did
          } catch (error) {
            log.error(error)
          }
        }
      },
      async onNotificationClicked(componentObject: GlobalRegisterComponent) {
        componentObject['eventId']= 'onNotificationClicked'
        
        const action = createAction({
          action: { emit: componentObject.emit, actionType: 'register' },
          trigger: 'register',
        }) as EmitAction

        const component = (await app.nui?.resolveComponents(
          componentObject,
        )) as NuiComponent.Instance

        componentObject.onEvent = async function onNotificationClicked(notificationID:number) {
          try {
            action.dataKey = { var: notificationID }
            await Promise.all(
              app.actions?.emit
                .get('register')
                ?.map((obj: Store.ActionObject) =>
                  obj?.fn?.(
                    action,
                    app.nui?.getConsumerOptions({
                      component,
                      page: app.mainPage?.getNuiPage(),
                    }),
                  ),
                ) || [],
            )
            return notificationID
          } catch (error) {
            log.error(error)
          }
        }
        
      },


    }
  }


  async handleRegister(componentObject: GlobalRegisterComponent) {
    let actions = componentObject.props.actions
    try {
      const component = (await this.app.nui?.resolveComponents(
        componentObject,
      )) as NuiComponent.Instance
      const actionTypeKeys = [
        'goto',
        'popUp',
        'popUpDismiss',
        'toast',
        'getLocationAddress',
        'pageJump',
        'refresh',
      ]
      for (const action of actions) {
        if (
          action?.actionType &&
          actionTypeKeys.includes(action?.actionType)
        ) {
          const newAction = createAction({
            action: action,
            trigger: 'register',
          })
          const type = action?.actionType
          const actionFn = this.app.root.actions[type]
          u.isFnc(actionFn) &&
            (await actionFn?.(
              newAction,
              this.app.nui?.getConsumerOptions({
                component,
                page: this.app.mainPage?.getNuiPage(),
              }),
            ))
        } else if (action?.actionType && action?.actionType == 'builtIn') {
          // const newAction = createAction({
          //   action: action,
          //   trigger: 'register',
          // })
          const functName = action.funcName
          const builtInFn =
            this.app.root.builtIn[functName] || this.app.root.extendedBuiltIn[functName]
          u.isFnc(builtInFn) &&
            (await builtInFn?.(
              action,
              this.app.nui?.getConsumerOptions({
                component,
                page: this.app.mainPage?.getNuiPage(),
              }),
            ))
        } else {
          const emitAction = createAction({
            action: {
              emit: {
                actions: [action],
              },
              actionType: 'register',
            },
            trigger: 'register',
          }) as EmitAction
          await this.app.actions?.emit
            .get('register')
            ?.map((obj: Store.ActionObject) =>
              obj?.fn?.(
                emitAction,
                this.app.nui?.getConsumerOptions({
                  component,
                  page: this.app.mainPage?.getNuiPage(),
                }),
              ),
            )
        }
      }
    } catch (error) {
      log.error(error)
    }
  }
  

  async registerHandlers(){
    for(let [key,value] of Object.entries(registerEvents)){
      //@ts-expect-error
      this.on(value,async()=>{
        if (this.app.ndom.global.register) {
          const componentObject = this.app.ndom.global.register.get(value)
          if (componentObject) {
            const onEvent = componentObject.props.onEvent as any
            log.info(`[register] ${onEvent}`)
            if(onEvent === 'onDisconnect'){
              if (u.isArr(this.timeId)) {
                for (let i = 0; i < this.timeId.length; i++) {
                  clearTimeout(this.timeId[i]?.id)
                }
              }      
            }
            await this.handleRegister(componentObject)
          }
        }
      })
    }
  }

  on<Hook extends RegisterHook>(
    hook: Hook,
    fn: RegisterHooks[Hook],
  ){
    if (!this.hooks.has(hook)) this.hooks.set(hook, [])
    if (!this.hooks.get(hook)?.includes?.(fn)) {
      this.hooks.get(hook)?.push(fn)
    }
    return this
  }

  emit<Hook extends RegisterHook>(
    hook: Hook,
    ...args: Parameters<RegisterHooks[Hook]>
  ) {
    this.hooks.get(hook)?.forEach?.((fn) => (fn as any)?.(...args))
  }

  createNotification() {
    if (this.app.globalRegister) {
      for (const componentObject of this.app.globalRegister) {
        if (is.component.register(componentObject)) {
          // Already attached a function
          if (u.isFnc(componentObject.onEvent)) continue
          if (!componentObject.onEvent) {
            log.error(
              `The "onEvent" identifier was not found in the register component!`,
              componentObject,
            )
            continue
          }

          if (
            u.isStr(componentObject.onEvent) &&
            u.isFnc(this.registrees[componentObject.onEvent])
          ) {
            const onEvent = componentObject.onEvent as any
            ;(this.registrees as any)[onEvent](componentObject)
          } else {
            // This block runs if the event is not in registrees
            this.app.nui.use({ register: componentObject })

            log.warn(
              `The register component "${componentObject.onEvent}" is not handled in the app yet`,
              componentObject,
            )

            const register = this.app.nui.cache.register.get(
              componentObject.onEvent as string,
            )

            if (register) {
              if (u.isFnc(register.fn)) {
                componentObject.onEvent = register.fn.bind(register) as any
                log.debug(`A function was attached on the "onEvent" property`, {
                  register,
                  component: componentObject,
                })
              } else if (!register.handler) {
                log.error(
                  `Alert! A register object was returned but the "fn" value was not a function and the "handler" object was empty!`,
                  { componentObject, register },
                )
              }
            } else {
              log.error(
                `Alert! The register component of event "${componentObject.onEvent}" was sent to noodl-ui but nothing was returned`,
                componentObject,
              )
            }
          }
        }
      }
    }
  }

  extendVideoFunction(onEvent: string) {
    // if (this.app.ndom.global.register) {
    //   const componentObject = this.app.ndom.global.register.get(onEvent)
    //   if (componentObject) {
    //     const onEvent = componentObject.props.onEvent as any
    //     console.log(onEvent)
    //     ;(this.registrees as any)[onEvent](componentObject)
    //   }
    // }
    //@ts-expect-error
    this.emit(onEvent)
  }


  setTimeId(key: string, id: unknown) {
    this.timeId.push({
      key: key,
      id: id,
    })
  }
  removeTime(key: string) {
    if (u.isArr(this.timeId)) {
      for (let i = 0; i < this.timeId.length; i++) {
        if (this.timeId[i]?.key === key) {
          clearTimeout(this.timeId[i]?.id)
          this.timeId.splice(i, 1)
          return
        }
      }
    }
  }

  removeAllTime() {
    if (u.isArr(this.timeId)) {
      for (let i = 0; i < this.timeId.length; i++) {
        clearTimeout(this.timeId[i]?.id)
        this.timeId.splice(i, 1)
      }
    }
  }
}

export default createRegisters
