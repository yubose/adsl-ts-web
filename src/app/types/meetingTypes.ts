import { Viewport } from 'noodl-ui'
import NOODLUIDOM, { Page } from 'noodl-ui-dom'
import {
  LocalParticipant,
  LocalTrack,
  LocalTrackPublication,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
} from 'twilio-video'

export type RoomParticipant = LocalParticipant | RemoteParticipant
export type RoomParticipantTrackPublication =
  | LocalTrackPublication
  | RemoteTrackPublication
export type RoomTrack = LocalTrack | RemoteTrack

export interface InitializeMeetingOptions {
  noodluidom: NOODLUIDOM
  page: Page
  viewport: Viewport
}

export type StreamType = 'mainStream' | 'selfStream' | 'subStream'
