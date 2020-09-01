import _ from 'lodash'
import { RemoteParticipant } from 'twilio-video'
import {
  RoomParticipant,
  RoomParticipantTrackPublication,
} from 'app/types/meeting'
// Giving color codes according to the feature that represents a certain stream
// Ex: rooms = #e50087
// This is to have an easier time debugging with console messages
export const color = {
  room: '#e50087',
  mainStream: '#e50087',
  remoteParticipant: '#B520CB',
  localParticipant: '#3852D8',
  selfStream: '#14BDAC',
  localStream: '#759000',
  other: '#B7771F',
}

export function forEachParticipant(
  participants: Map<string, RemoteParticipant>,
  cb: (participant: RemoteParticipant) => any,
) {
  participants?.forEach(cb)
}

export function forEachParticipantTrack(
  tracks: Map<string, RoomParticipantTrackPublication>,
  cb: (
    publication: RoomParticipantTrackPublication,
    participant: RoomParticipant,
  ) => any,
) {
  tracks?.forEach(cb)
}
