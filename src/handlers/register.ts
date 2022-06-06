import * as u from '@jsmanifest/utils'
import Logger from 'logsnap'
import { PageObject } from 'noodl-types'
import {
  createAction,
  createActionChain,
  EmitAction,
  NUI,
  NUIActionChain,
  NUIActionObject,
  NuiComponent,
  Register,
  Store,
} from 'noodl-ui'
import App from '../App'
import { copyToClipboard } from '../utils/dom'
import is from '../utils/is'
import { GlobalRegisterComponent } from '../app/types'

type Room = any

const log = Logger.create('register.ts')

class createRegisters{
  app: App
  o: Record<string, any>
  registrees: Record<string, any>
  numberofExtensions: number = 0
  timePerExtendSeconds: number = 0
  popUpWaitSeconds: number = 30
  meetingEndTime:number = 0
  public timeId: Record<string, any>[] = []
  constructor(app: App){
    this.app = app

    this.app.notification?.on('message', (message) => {
      if (message) {
        const { data } = message
        if (data?.did) {
          //  call onNewEcosDoc for now  until we propose a more generic approach
          const onNewEcosDocRegisterComponent = app.globalRegister?.find?.(
            (obj) => obj?.eventId === 'onNewEcosDoc',
          )
          onNewEcosDocRegisterComponent?.onEvent?.(data.did)
        } else {
          console.log({ message })
          debugger
        }
      }
    })

    this.o = {
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
          const token = await app.notification?.getToken({
            serviceWorkerRegistration:
              app.serviceWorkerRegistration as ServiceWorkerRegistration,
          })
          copyToClipboard(token as string)
          return token
        } catch (error) {
          console.error(error)
          return error
        }
      },
      async onNotificationClicked(obj: Register.Object, arg) {
        log.func('onNotificationClicked')
        log.hotpink('', { obj, arg })
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
  
      async twilioOnPeopleShowRoom(obj: Register.Object, arg) {
        log.func('twilioOnPeopleShowRoom')
        log.hotpink('', { obj, arg })
        debugger
      },
    }
    
    const handleRegister = async(componentObject: GlobalRegisterComponent)=>{
      let actions = componentObject.actions
      try{
        const component = (await this.app.nui?.resolveComponents(
          componentObject,
        )) as NuiComponent.Instance
        const actionTypeKeys = ['goto','popUp','popUpDismiss','toast','getLocationAddress','pageJump','refresh']
        for(const action of actions){
          if(action?.actionType && actionTypeKeys.includes(action?.actionType) ){
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
                })
              ))
          }else if(action?.actionType && action?.actionType == 'builtIn'){
            const functName = action.funcName
            const builtInFn = app.root.builtIn[functName] || app.root.extendedBuiltIn[functName]
            u.isFnc(builtInFn) && 
            (await builtInFn?.(
              action,
              this.app.nui?.getConsumerOptions({
                component,
                page: this.app.mainPage?.getNuiPage(),
              })
            ))
          }else{
            const emitAction = createAction({
              action: { 
                emit: {
                  actions: [action]
                }, 
                actionType: 'register' 
              },
              trigger: 'register',
            }) as EmitAction
            await this.app.actions?.emit.get('register')?.map((obj: Store.ActionObject) =>
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
      }catch(error){
        console.error(error)
      } 
    }

    this.registrees = {
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
          ?.getToken({
            serviceWorkerRegistration:
              app.serviceWorkerRegistration as ServiceWorkerRegistration,
          })
          .then(async (token) => {
            log.grey('', {
              token,
              serviceWorkerRegistration: app.serviceWorkerRegistration,
            })
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
      async onDisconnect(componentObject: GlobalRegisterComponent){
        log.func('onDisconnect')
        componentObject.eventId = 'onDisconnect'
        if(u.isArr(this.timeId)){
          for (let i = 0; i < this.timeId.length; i++) {
            clearTimeout(this.timeId[i]?.id)
          }
        }
        this.timeId = []
        await handleRegister(componentObject)
      },
      async showExtendView(componentObject: GlobalRegisterComponent){
        log.func('showExtendView')
        componentObject.eventId = 'showExtendView'
        await handleRegister(componentObject)
        
      },
      async onProviderDisconnect(componentObject: GlobalRegisterComponent){
        log.func('onProviderDisconnect')
        componentObject.eventId = 'onProviderDisconnect'
        await handleRegister(componentObject)
        
      },
      async showExitWarningView(componentObject: GlobalRegisterComponent){
        log.func('showExitWarningView')
        componentObject.eventId = 'showExitWarningView'
        await handleRegister(componentObject)
        
      },
    }

  }
  registerHandlers = {
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


  createNotification() {
    if (this.app.globalRegister) {
      log.func('createNotification')

      for (const componentObject of this.app.globalRegister) {
        if (is.component.register(componentObject)) {
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
            u.isFnc(this.registrees[componentObject.onEvent])
          ) {
            const onEvent = componentObject.onEvent as any
            ;(this.registrees as any)[onEvent](componentObject)
          } else {
            // This block runs if the event is not in registrees
            this.app.nui.use({ register: componentObject })

            log.func('onInitPage')
            log.orange(
              `The register component "${componentObject.onEvent}" is not handled in the app yet`,
              componentObject,
            )

            const register = this.app.nui.cache.register.get(
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

  extendVideoFunction(onEvent:string){
    log.func('extendVideoFunction')

    const pageName = this.app.mainPage?.getNuiPage().page
    const components = this.app.root?.['VideoChat'].components
    for (const componentObject of components) {
      if (is.component.register(componentObject)) {
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
          componentObject.onEvent === onEvent &&
          u.isStr(componentObject.onEvent) &&
          u.isFnc(this.registrees[componentObject.onEvent])
        ) {
          const onEvent = componentObject.onEvent as any
          ;(this.registrees as any)[onEvent](componentObject)
        } 
      }
    }
  }

  setNumberofExtensions(numberofExtensions){
    this.numberofExtensions = numberofExtensions as number
  }
  getNumberofExtensions(){
    return this.numberofExtensions
  }

  setTimePerExtendSeconds(timePerExtendSeconds){
    this.timePerExtendSeconds = timePerExtendSeconds
  }
  getTimePerExtendSeconds(){
    return this.timePerExtendSeconds
  }

  setPopUpWaitSeconds(popUpWaitSeconds){
    this.popUpWaitSeconds = popUpWaitSeconds
  }
  getPopUpWaitSeconds(){
    return this.popUpWaitSeconds
  }
  setMeetingEndTime(meetingEndTime){
    this.meetingEndTime = meetingEndTime
  }
  getMeetingEndTime(){
    return this.meetingEndTime
  }

  setTimeId(key:string,id:unknown){
    this.timeId.push({
      key: key,
      id: id,
    })
  }
  removeTime(key:string){
    if(u.isArr(this.timeId)){
      for (let i = 0; i < this.timeId.length; i++) {
        if (this.timeId[i]?.key === key) {
          clearTimeout(this.timeId[i]?.id)
          this.timeId.splice(i, 1)
          return
        }
      }
    }
  }

  removeAllTime(){
    if(u.isArr(this.timeId)){
      for (let i = 0; i < this.timeId.length; i++) {
        clearTimeout(this.timeId[i]?.id)
        this.timeId.splice(i, 1)
      }
    }
  }


}

export default createRegisters
