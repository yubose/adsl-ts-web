import firebase from 'firebase'
import type { CADL, Account } from '@aitmed/cadl'
import { NDOM, NUI, NUIAction, NUITrigger, Viewport } from 'noodl-ui'
import { ActionObject, PageObject, RegisterComponentObject } from 'noodl-types'
import AppNotification from '../Notifications'
import createMeetingFns from '../../meeting'
import { ActionEvent } from '../../constants'
import createCallingFns from '../../calling/Calling'
export * from './domTypes'
export * from './meetingTypes'
// export * from './twilio'
export interface SelfUserInfo {
  audio: string
  avatar: string | undefined
  bShareAudioOn: boolean | undefined
  bShareToSubsession: boolean | undefined
  bVideoOn: boolean | undefined
  bVideoShare: boolean | undefined
  displayName: string | undefined
  isAllowIndividualRecording: boolean | undefined
  isHost: boolean | undefined
  isInFailover: boolean | undefined
  isManager: boolean | undefined
  isPhoneUser: boolean | undefined
  isSpeakerOnly: boolean | undefined
  isVideoConnect: boolean | undefined
  muted: boolean | undefined
  sharerOn: boolean | undefined
  sharerPause: boolean | undefined
  userGuid: string | undefined
  userId: string
  userIdentity: string | undefined
}
export interface AppState {
  actionEvents: AppStateActionEvent[]
  authStatus: AuthStatus | ''
  initialized: boolean
  loadingPages: Record<string, { id: string; init: boolean }[]>
  spinner: AppSpinnerState
  tracking: {}
}

export interface AppStateActionEvent {
  type: 'action'
  kind: ActionEvent
  timestamp: number
  status: 'ended' | 'pending' | 'ready'
}

export interface AppSpinnerState {
  active: boolean
  config: {
    delay: number
    timeout: number
  }
  page: string | null
  ref: NodeJS.Timeout | null
  timeout: NodeJS.Timeout | null
  trigger: NUITrigger | 'inject' | null
}

export interface videoActiveChange {
  state: 'Active' | 'Inactive'
  userId: number
}

export class ZoomError extends Error {
  // 自定义属性
  type: string
  reason: string

  constructor(message: string, type: string, reason: string) {
    super(message)
    this.type = type
    this.reason = reason
  }
}

export interface AppConstructorOptions {
  configKey?: string
  getStatus?: typeof Account.getStatus
  meeting?: Meeting | typeof createMeetingFns
  calling?: Calling | typeof createCallingFns
  notification?: AppNotification
  noodl?: CADL
  ndom?: NDOM
  nui?: typeof NUI
  viewport?: Viewport
}

export type AuthStatus =
  | 'logged.in'
  | 'logged.out'
  | 'new.device'
  | 'temporary'
  | null

export type AppObservers<Id extends keyof AppObserver = keyof AppObserver> =
  Map<Id, AppObserver[Id]['fn'][]>

export interface AppObserver {
  onInitPage: {
    fn: (pageObject: PageObject) => void
    params: PageObject
  }
}

export type ActionMetadata<PKey extends string = string> = Record<
  PKey,
  Record<string, any> | { fromAction?: any; fromComponent?: any }
> &
  Record<string, any> & {
    action: { instance: NUIAction | undefined; object: ActionObject }
    trigger: NUITrigger
  }

export type Meeting = ReturnType<typeof createMeetingFns>
export type Calling = ReturnType<typeof createCallingFns>
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
  click(notificationID: number): void
}

export type AppNotificationHook = keyof AppNotificationHooks

export interface AppNotificationMessageObject<
  O extends Record<string, any> = Record<string, any>,
> {
  data: O
  from?: string
  priority?: 'normal'
}

export interface CachedPageObject {
  name: string
  timestamp: number
}

export interface GlobalRegisterComponent<EventId extends string = string>
  extends Omit<RegisterComponentObject, 'onEvent'> {
  type: 'register'
  eventId: EventId
  onEvent(...args: any[]): any
}

export type ObjectWithPriority<
  O extends Record<string, any> = Record<string, any>,
> = O & { priority?: number }
