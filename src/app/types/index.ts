import firebase from 'firebase'
export * from './meetingTypes'

export interface AnyFn<Args = any, RT = any> {
  (...args: Args[]): RT
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
