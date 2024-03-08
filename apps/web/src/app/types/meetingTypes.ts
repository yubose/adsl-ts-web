import { Viewport } from 'noodl-ui'
import { NDOM, NDOMPage } from 'noodl-ui'

/**
 * Additional static typings (not part of the twilio-video cdn script)
 */

export interface InitializeMeetingOptions {
  ndom: NDOM
  page: NDOMPage
  viewport: Viewport
}

export type StreamType = 'mainStream' | 'selfStream' | 'subStream'

export const MeetingPages = ['MeetingPage', 'VideoChat']
