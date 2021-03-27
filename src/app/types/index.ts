import firebase from 'firebase'
import CADL, { Account } from '@aitmed/cadl'
import { NOODLUI as NUI, Viewport } from 'noodl-ui'
import NOODLDOM from 'noodl-ui-dom'
import createMeetingFns from '../../meeting'
export * from './meetingTypes'

export interface AppConstructorOptions {
  getStatus?: typeof Account.getStatus
  meeting?: ReturnType<typeof createMeetingFns>
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

export type FirebaseApp = firebase.app.App
export type FirebaseMessaging = firebase.messaging.Messaging
