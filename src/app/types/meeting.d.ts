import {
  connect,
  LocalParticipant,
  LocalTrack,
  LocalVideoTrackPublication,
  LocalAudioTrackPublication,
  Room,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,, LocalTrackPublication
} from 'twilio-video'

export type RoomParticipant = LocalParticipant | RemoteParticipant
export type RoomParticipantTrackPublication = LocalTrackPublication | RemoteTrackPublication
export type RoomTrack = LocalTrack | RemoteTrack