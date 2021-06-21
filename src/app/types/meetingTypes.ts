import { Viewport } from 'noodl-ui'
import NOODLOM, { Page } from 'noodl-ui-dom'
import tw from 'twilio-video'

/**
 * Additional static typings (not part of the twilio-video cdn script)
 */
export type LocalTrack = tw.LocalTrack
export type LocalParticipant = tw.LocalParticipant
export type LocalAudioTrack = tw.LocalAudioTrack
export type LocalVideoTrack = tw.LocalVideoTrack
export type LocalVideoTrackPublication = tw.LocalVideoTrackPublication
export type LocalAudioTrackPublication = tw.LocalAudioTrackPublication
export type RemoteTrack = tw.RemoteTrack
export type RemoteParticipant = tw.RemoteParticipant
export type RemoteAudioTrackPublication = tw.RemoteAudioTrackPublication
export type RemoteTrackPublication = tw.RemoteTrackPublication
export type RemoteVideoTrackPublication = tw.RemoteVideoTrackPublication
export type RoomParticipant = LocalParticipant | RemoteParticipant
export type RoomParticipantTrackPublication =
  | tw.LocalTrackPublication
  | tw.RemoteTrackPublication
export type RoomTrack = tw.LocalTrack | tw.RemoteTrack
export type Room = tw.Room

export interface InitializeMeetingOptions {
  ndom: NOODLOM
  page: Page
  viewport: Viewport
}

export type StreamType = 'mainStream' | 'selfStream' | 'subStream'
