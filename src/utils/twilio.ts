import _ from 'lodash'
import { RemoteParticipant, VideoTrack } from 'twilio-video'

export function forEachParticipant(
  participants: Map<string, RemoteParticipant>,
  cb: (participant: RemoteParticipant) => any,
) {
  _.forEach(Array.from(participants.values()), cb)
}

/**
 * Helper to attach the video track to the node. Setting these style properties
 * are required for the video to align with the parentNode's dimensions
 * @param { NOODLDOMElement } node - HTML DOM node to attach the VideoTrack to
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
