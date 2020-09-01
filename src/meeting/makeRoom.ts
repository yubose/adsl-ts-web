import { EventEmitter } from 'events'
import { getByDataUX, ViewportOptions } from 'noodl-ui'
import Page from 'Page'
import {
  connect,
  LocalParticipant,
  LocalTrack,
  LocalVideoTrackPublication,
  LocalAudioTrackPublication,
  Room,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
} from 'twilio-video'
import { isMobile } from 'utils/common'
import makeLocalTracks from './makeLocalTracks'
import makeParticipants from './makeParticipants'

export type MeetingRoom = ReturnType<typeof makeRoom>

function makeRoom({
  isRoomEnvironment,
  page,
  viewport,
}: {
  isRoomEnvironment: boolean
  page: Page
  viewport: ViewportOptions
}) {
  let _room = new EventEmitter() as Room
  let _cachedLocalTracks: LocalTrack[] = []

  const { addParticipant } = makeParticipants({
    handleWaitingOthersMessage,
    room: _room,
  })

  const {
    localTracks,
    fetchingLocalTracks,
    getTracks,
    getLocalVideoTrack,
    getLocalAudioTrack,
    removeLocalVideoTrack,
    toggleVideo,
    toggleCamera,
  } = makeLocalTracks({ isRoomEnvironment, room, viewport })

  function _set(room: Room) {
    _room = room
  }

  async function _connect(token: string) {
    try {
      const tracks: LocalTrack[] | undefined = !localTracks?.length
        ? await getTracks()
        : []

      // We purposely returned empty tracks so we can let them in the meeting and to handle
      // this special case
      if (!tracks?.length) {
        //
      }

      const room = await connect(token, {
        dominantSpeaker: true,
        logLevel: 'info',
        tracks,
        bandwidthProfile: {
          video: {
            dominantSpeakerPriority: 'high',
            mode: 'collaboration',
            // For mobile browsers, limit the maximum incoming video bitrate to 2.5 Mbps
            ...(isMobile() ? { maxSubscriptionBitrate: 2500000 } : undefined),
          },
        },
      })

      _set(room)

      console.log(
        `%c[makeRoom.ts][connect] Connected to room`,
        `color:green;font-weight:bold;`,
        room,
      )

      const disconnect = () => room.disconnect()

      // Local participant disconnected
      const disconnected = () => {
        const unpublishTracks = (
          trackPublication:
            | LocalVideoTrackPublication
            | LocalAudioTrackPublication,
        ) => {
          trackPublication?.track?.stop?.()
          trackPublication?.unpublish?.()
        }
        // Unpublish local tracks
        _.forEach(room.localParticipant.videoTracks, unpublishTracks)
        _.forEach(room.localParticipant.audioTracks, unpublishTracks)
        window.room = null
        // Reset the room only after all other `disconnected` listeners have been called.
        setTimeout(() => _set(new EventEmitter() as Room))
        window.removeEventListener('beforeunload', disconnect)
        if (isMobile()) {
          window.removeEventListener('pagehide', disconnect)
        }
      }

      // Add currently connected participants to the state
      room.participants.forEach((participant: RemoteParticipant) => {
        console.log(
          `%c[makeRoom.tsx][connect#participantConnected]`,
          `color:green;font-weight:bold;`,
          { participant, room: room },
        )
        addParticipant(participant)
      })

      room.once('disconnected', disconnected)

      /** Handle publishing/unpublishing their incoming/present tracks */
      room.participants?.forEach((participant: RemoteParticipant) => {
        _onParticipantConnected(participant)
      })

      window.room = room
      window.lparticipant = room.localParticipant

      // Publish local participants tracks (self stream / local video preview)
      _cachedLocalTracks.forEach((track) => {
        // Tracks can be supplied as arguments to the Video.connect() function and they will automatically be published.
        // However, tracks must be published manually in order to set the priority on them.
        // All video tracks are published with 'low' priority. This works because the video
        // track that is displayed in the 'MainParticipant' component will have it's priority
        // set to 'high' via track.setPriority()
        // @ts-expect-error
        room.localParticipant?.publishTrack?.(track as LocalTrack, {
          priority: track?.kind === 'video' ? 'low' : 'standard',
        })
      })

      // Add a listener to disconnect from the room when a user closes their browser
      window.addEventListener('beforeunload', disconnect)
      // Add a listener to disconnect from the room when a mobile user closes their browser
      if (isMobile()) window.addEventListener('pagehide', disconnect)

      handleWaitingOthersMessage(room.participants)

      return room
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        window.alert(
          `We do not have permission to publish one or more of your devices. Please check your browser's settings if this was unintentional`,
        )
      } else {
        window.alert(error.message)
      }
      throw error
    }
  }

  function _onParticipantConnected(participant: RemoteParticipant) {
    // Handle the TrackPublications already published by the Participant.
    participant.tracks.forEach((publication) => {
      _onTrackPublished(publication, participant)
    })
    // Handle the TrackPublications that will be published by the Participant later.
    participant.on('trackPublished', (publication) => {
      _onTrackPublished(publication, participant)
    })
  }

  function _onTrackPublished(
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ) {
    // If the TrackPublication is already subscribed to, then attach the Track to the DOM.
    if (publication.track) {
      _attachTrack(publication.track, participant)
    }

    // Once the TrackPublication is subscribed to, attach the Track to the DOM.
    publication.on('subscribed', (track) => {
      _attachTrack(track, participant)
    })

    // Once the TrackPublication is unsubscribed from, detach the Track from the DOM.
    publication.on('unsubscribed', (track) => {
      _detachTrack(track, participant)
    })
  }

  /**
   * Attach a Track to the DOM.
   * @param track - the Track to attach
   * @param participant - the Participant which published the Track
   */
  function _attachTrack(track: RemoteTrack, participant: RemoteParticipant) {
    // Attach the Participant's Track to the thumbnail.
    // TODO: Use track.attach here to the remote participant streams
    // track.attach
    // If the attached Track is a VideoTrack that is published by the active
    // Participant, then attach it to the main stream
    if (track.kind === 'video' && participant === activeParticipant) {
      //
    }
  }

  /**
   * Detach a Track from the DOM.
   * @param track - the Track to be detached
   * @param participant - the Participant that is publishing the Track
   */
  function _detachTrack(track: RemoteTrack, participant: RemoteParticipant) {
    // Detach the Participant's Track from the thumbnail.
    // TODO: Use track.detach here to the remote participant streams

    // If the detached Track is a VideoTrack that is published by the active
    // Participant, then detach it from the main video as well.
    if (track.kind === 'video' && participant === activeParticipant) {
      // track.detach
    }
  }

  // React.useEffect(() => {
  //   if (!isRoomEnvironment) {
  //     if (room.state !== 'disconnected') {
  //       const logMsg = `%c[makeRoom.tsx][React.useEffect] Disconnecting from the room...`
  //       console.log(logMsg, `color:${color.room};font-weight:bold;`)
  //       room?.disconnect?.()
  //     }
  //   }
  //   return () => {
  //     room?.disconnect?.()
  //   }
  // }, [isRoomEnvironment, room])

  /**
   * Manages the visible/hidden state for the "Waiting for others to join" message
   * @param { object | array } participants - Participants from either the room instance, arrayed form, or the local state
   */
  function handleWaitingOthersMessage(
    participants:
      | Map<string, LocalParticipant | RemoteParticipant>
      | Array<LocalParticipant | RemoteParticipant>
      | UseParticipantsState,
    // The delay is used to wait for the components to display so that getByDataUX
    // can detect them when they load
    delay: number = 1000,
  ) {
    const handleVisibility = (visibleStatus: 'visible' | 'hidden') => {
      setTimeout(() => {
        const waitingElem = getByDataUX('passwordHidden') as any
        if (waitingElem) {
          if (visibleStatus === 'hidden') {
            // Hide the "Waiting for others" message
            set(waitingElem.style, 'visibility', 'visible')
          } else if (visibleStatus === 'visible') {
            // Show the "Waiting for others" message
            set(waitingElem.style, 'visibility', 'hidden')
          }
        }
      }, delay)
    }
    if (Array.isArray(participants)) {
      if (participants.length > 0) {
        handleVisibility('visible')
      } else {
        handleVisibility('hidden')
      }
    } else if (participants) {
      if ('primary' in participants) {
        if (participants.primary || participants.secondary.length) {
          handleVisibility('visible')
        } else {
          handleVisibility('hidden')
        }
      } else if (typeof participants.size === 'number') {
        if (participants.size > 0) {
          handleVisibility('visible')
        } else {
          handleVisibility('hidden')
        }
      }
    }
  }

  const o = {
    async connect(...args: Parameters<typeof _connect>) {
      return _connect(...args)
    },
    get() {
      return _room
    },
  }

  return o
}

export default makeRoom
