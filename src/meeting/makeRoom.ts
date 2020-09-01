import { EventEmitter } from 'events'
import { getByDataUX, ViewportOptions } from 'noodl-ui'
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
  LocalTrackPublication,
} from 'twilio-video'
import Page from 'Page'
import {
  RoomParticipant,
  RoomParticipantTrackPublication,
  RoomTrack,
} from 'app/types/meeting'
import { isMobile } from 'utils/common'
import makeLocalTracks from './makeLocalTracks'
import makeParticipants from './makeParticipants'

export type AppRoom = ReturnType<typeof makeRoom>

function makeRoom({
  isRoomEnvironment,
  page,
  viewport,
}: {
  isRoomEnvironment: boolean
  page: Page
  viewport: ViewportOptions
}) {
  const _state = {
    room: new EventEmitter() as Room,
    cachedLocalTracks: []
  }

  const { addParticipant } = makeParticipants({
    handleWaitingOthersMessage,
    room: _state.room,
  })

  function _set(room: Room) {
    _state.room = room
  }

  async function _connect(token: string) {
    try {
      const room = await connect(token, {
        dominantSpeaker: true,
        logLevel: 'info',
        bandwidthProfile: {
          video: {
            dominantSpeakerPriority: 'high',
            mode: 'collaboration',
            // For mobile browsers, limit the maximum incoming video bitrate to 2.5 Mbps
            ...(isMobile() ? { maxSubscriptionBitrate: 2500000 } : undefined),
          },
        },
      })

      let localVideoTrack = Array.from(
        room.localParticipant?.videoTracks?.values?.(),
      )?.[0].track

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
      _state.cachedLocalTracks.forEach((track) => {
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

  /**
   * Handle tracks published as well as tracks that are going to be published
   * @param { LocalParticipant | RemoteParticipant } participant
   */
  function _onParticipantConnected(
    participant: LocalParticipant | RemoteParticipant,
  ) {
    // Handle the TrackPublications already published by the Participant.
    participant.tracks.forEach(
      (publication: RoomParticipantTrackPublication) => {
        _onTrackPublished(publication, participant)
      },
    )
    // Handle the TrackPublications that will be published by the Participant later.
    participant.on(
      'trackPublished',
      (publication: RoomParticipantTrackPublication) => {
        _onTrackPublished(publication, participant)
      },
    )
  }

  /**
   * Attach the published track once it is subscribed
   * @param { RoomParticipantTrackPublication } publication - Track publication
   * @param { RoomParticipant } participant
   */
  function _onTrackPublished(
    publication: RoomParticipantTrackPublication,
    participant: RoomParticipant,
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
    publication.on('unsubscribed', (track:) => {
      _detachTrack(track, participant)
    })
  }

  /**
   * Attaches the Track to the DOM.
   * @param { RoomTrack } track
   * @param { RoomParticipant } participant
   */
  function _attachTrack(track: RoomTrack, participant: RoomParticipant) {
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
   * Detach the Track from the DOM.
   * @param { RoomTrack } track
   * @param { RoomParticipant } participant
   */
  function _detachTrack(track: RoomTrack, participant: RoomParticipant) {
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
    get(key: keyof typeof _state | undefined) {
      return key ? _state[key as keyof typeof _state] : _state
    },
  }

  return o
}

export default makeRoom
