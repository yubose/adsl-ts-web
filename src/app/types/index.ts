import firebase from 'firebase'
import CADL, { Account } from '@aitmed/cadl'
import { NUI, Viewport } from 'noodl-ui'
import { EmitObject } from 'noodl-types'
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
  actions: EmitObject['emit']['actions']
  dataKey: EmitObject['emit']['dataKey']
  pageName: string
}

export type FirebaseApp = firebase.app.App
export type FirebaseMessaging = firebase.messaging.Messaging

export type Meeting = ReturnType<typeof createMeetingFns>
