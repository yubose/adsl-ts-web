import firebase from 'firebase'
import CADL, { Account } from '@aitmed/cadl'
import { NUI, NUIAction, NUITrigger, Viewport } from 'noodl-ui'
import {
  ActionObject,
  EmitObjectFold,
  PageObject,
  RegisterComponentObject,
} from 'noodl-types'
import NOODLDOM from 'noodl-ui-dom'
import AppNotification from '../Notifications'
import createMeetingFns from '../../meeting'
export * from './domTypes'
export * from './meetingTypes'
export * from './twilio'

export interface AppConstructorOptions {
  getStatus?: typeof Account.getStatus
  meeting?: Meeting | typeof createMeetingFns
  notification?: AppNotification
  noodl?: CADL
  ndom?: NOODLDOM
  nui?: typeof NUI
  viewport?: Viewport
}

export type AuthStatus =
  | 'logged.in'
  | 'logged.out'
  | 'new.device'
  | 'temporary'
  | null

export interface CachedPageObject {
  name: string
  timestamp: number
}

export interface EmitCallParams {
  actions: EmitObjectFold['emit']['actions']
  dataKey: EmitObjectFold['emit']['dataKey']
  pageName: string
}

export type AppObservers<Id extends keyof AppObserver = keyof AppObserver> =
  Map<Id, AppObserver[Id]['fn'][]>

export interface AppObserver {
  onInitPage: {
    fn: (pageObject: PageObject) => void
    params: PageObject
  }
}

export type ActionMetadata<PKey extends string = string> = {
  action: { instance: NUIAction | undefined; object: ActionObject }
  trigger: NUITrigger
} & Record<
  PKey,
  Record<string, any> | { fromAction?: any; fromComponent?: any }
> &
  Record<string, any>

export type Meeting = ReturnType<typeof createMeetingFns>
export type FirebaseApp = firebase.app.App
export type FirebaseMessaging = firebase.messaging.Messaging

export interface AppNotificationHooks {
  message<
    Msg extends AppNotificationMessageObject = AppNotificationMessageObject,
  >(
    msg: Msg,
  ): void
  error(error: Error): void
  complete(): void
  initiated(client: firebase.app.App): void
  initError(error: Error): void
  token(token: string): void
}

export type AppNotificationHook = keyof AppNotificationHooks

export interface AppNotificationMessageObject<
  O extends Record<string, any> = Record<string, any>,
> {
  data: O
  from?: string
  priority?: 'normal'
}

export interface GlobalRegisterComponent<EventId extends string = string>
  extends Omit<RegisterComponentObject, 'onEvent'> {
  type: 'register'
  eventId: EventId
  onEvent(...args: any[]): any
}
