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

export interface IMeeting {
  initialize(options: InitializeMeetingOptions): this
  join(token: string, options?: ConnectOptions): Promise<Room>
  leave(): this
  getMainStreamElement(): HTMLDivElement | null
  getSelfStreamElement(): HTMLDivElement | null
  getSubStreamElement(): HTMLDivElement | null
  getCameraElement(): HTMLImageElement | null
  getMicrophoneElement(): HTMLImageElement | null
  getHangUpElement(): HTMLImageElement | null
  getInviteOthersElement(): HTMLImageElement | null
  getParticipantsListElement(): HTMLUListElement | null
  getVideoChatElements(): {
    mainStream: ReturnType<IMeeting['getMainStreamElement']>
    selfStream: ReturnType<IMeeting['getSelfStreamElement']>
    subStream: ReturnType<IMeeting['getSubStreamElement']>
    camera: ReturnType<IMeeting['getCameraElement']>
    microphone: ReturnType<IMeeting['getMicrophoneElement']>
    hangUp: ReturnType<IMeeting['getHangUpElement']>
    inviteOthers: ReturnType<IMeeting['getInviteOthersElement']>
    vidoeSubStream: ReturnType<IMeeting['getParticipantsListElement']>
  }
  getStreamsController(): IStreams
  isParticipantLocal(
    participant: RoomParticipant,
  ): participant is LocalParticipant
  isParticipantMainStreaming(participant: RoomParticipant): boolean
  isParticipantSelfStreaming(participant: RoomParticipant): boolean
  onConnected?(room: Room): any
  resetRoom(): this
  refreshMainStream(options: Partial<ParticipantStreamObject>): this
  refreshSelfStream(options: Partial<ParticipantStreamObject>): this
  room: Room
}

export type StreamNode = HTMLDivElement | null
export type StreamParticipant = RoomParticipant | null
export type ParticipantStreamMap = Map<RoomParticipant, ParticipantStreamObject>
export type ParticipantStreamObject = {
  node: StreamNode
  participant: StreamParticipant
}

export interface IStreams {
  mainStream: ParticipantStreamObject
  selfStream: ParticipantStreamObject
  subStreams: ParticipantStreamMap
  setMainStream(obj: ParticipantStreamObject): this
  setSelfStream(obj: ParticipantStreamObject): this
}
