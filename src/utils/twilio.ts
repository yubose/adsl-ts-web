import _ from 'lodash'
import { RemoteParticipant, VideoTrack } from 'twilio-video'

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
  _.forEach(Array.from(participants.values()), cb)
}

/**
 * Helper to attach the video track to the node. Setting these style properties
 * are required for the video to align with the parentNode's dimensions
 * @param { DOMNode } node - HTML DOM node to attach the VideoTrack to
 * @param { VideoTrack } track - Video track from a participant
 */
export function attachVideoTrack<T extends HTMLElement>(
  node: T,
  track: VideoTrack,
) {
  const videoElem = track.attach()
  videoElem.style.width = '100%'
  videoElem.style.height = '100%'
  videoElem.style.objectFit = 'cover'
  node.appendChild(videoElem)
  return node
}
