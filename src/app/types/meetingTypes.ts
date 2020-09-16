import { Viewport } from 'noodl-ui'
import {
  ConnectOptions,
  LocalParticipant,
  LocalTrack,
  LocalTrackPublication,
  Room,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
} from 'twilio-video'
import { AppStore, IPage } from '.'
import { DOMNode } from './pageTypes'

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

export type StreamNode = HTMLDivElement | null
export type StreamParticipant = RoomParticipant | null
export type ParticipantStreamMap = Map<RoomParticipant, ParticipantStreamObject>
export type ParticipantStreamObject = {
  node: StreamNode
  participant: StreamParticipant
}

export type StreamType = 'mainStream' | 'selfStream' | 'subStream'

export interface IStreams {
  mainStream: ParticipantStreamObject
  selfStream: ParticipantStreamObject
  subStreams: ParticipantStreamMap
  setMainStream(obj: ParticipantStreamObject): this
  setSelfStream(obj: ParticipantStreamObject): this
  setSubStreamsContainer(node: DOMNode): this
  getSubStreams(): ParticipantStreamMap
}
