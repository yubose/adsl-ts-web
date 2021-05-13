import firebase from 'firebase'
import CADL, { Account } from '@aitmed/cadl'
import { NUI, NUIAction, NUITrigger, Viewport } from 'noodl-ui'
import { ActionObject, EmitObjectFold, PageObject } from 'noodl-types'
import NOODLDOM from 'noodl-ui-dom'
import createMeetingFns from '../../meeting'
export * from './domTypes'
export * from './meetingTypes'

export interface AppConstructorOptions {
  getStatus?: typeof Account.getStatus
  meeting?: Meeting | typeof createMeetingFns
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
