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
  onConnected?(room: Room): any
  room: Room
}
