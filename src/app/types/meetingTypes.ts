import { Viewport } from 'noodl-ui'
import {
  LocalParticipant,
  LocalTrack,
  LocalTrackPublication,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
} from 'twilio-video'
import { AppStore, IPage } from '.'

export type RoomParticipant = LocalParticipant | RemoteParticipant
export type RoomParticipantTrackPublication =
  | LocalTrackPublication
  | RemoteTrackPublication
export type RoomTrack = LocalTrack | RemoteTrack

export interface InitializeMeetingOptions {
  store: AppStore
  page: IPage
  viewport: Viewport
}

export type StreamType = 'mainStream' | 'selfStream' | 'subStream'
