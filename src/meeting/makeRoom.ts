import { EventEmitter } from 'events'
import { getByDataUX, ViewportOptions } from 'noodl-ui'
import {
  connect as connectToRoom,
  ConnectOptions,
  LocalTrack,
  LocalVideoTrackPublication,
  LocalAudioTrackPublication,
  LocalParticipant,
  Room,
  RemoteParticipant,
  TrackPublication,
} from 'twilio-video'
import { isMobile } from 'utils/common'
import makeLocalTracks from './makeLocalTracks'
import makeParticipants from './makeParticipants'

function makeRoom({
  isRoomEnvironment,
  viewport,
}: {
  isRoomEnvironment: boolean
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

  React.useEffect(() => {
    // It can take a moment for Video.connect to connect to a room. During this time, the user
    // may have enabled or disabled their local audio or video tracks. If this happens, we
    // store the localTracks in this ref, so that they are correctly published once the user
    // is connected to the room.
    localTracksRef.current = localTracks
  }, [localTracks])

  const connect = React.useCallback(
    async (token: string) => {
      try {
        let tracks: LocalTrack[] | undefined = localTracksRef.current

        if (!localTracksRef.current?.length) {
          tracks = await getTracks(undefined, token)
        }

        // We purposely returned empty tracks so we can let them in the meeting and to handle
        // this special case
        if (!tracks.length) {
          //
        }

        const roomOptions: ConnectOptions = {
          dominantSpeaker: true,
          logLevel: 'info',
          tracks,
          // tracks: [],
          // tracks: localTracksRef.current,
          bandwidthProfile: {
            video: {
              dominantSpeakerPriority: 'high',
              mode: 'collaboration',
              // For mobile browsers, limit the maximum incoming video bitrate to 2.5 Mbps
              ...(isMobile() ? { maxSubscriptionBitrate: 2500000 } : undefined),
            },
          },
        }

        setConnecting(true)
        const newRoom = await connectToRoom(token, roomOptions)
        setRoom(newRoom)
        setConnecting(false)

        console.log(
          `%c[MeetingRoomContext.tsx][connect] Connected to room`,
          `color:${color.room};font-weight:bold;`,
          newRoom,
        )

        const addExistingParticipant = (participant: RemoteParticipant) => {
          console.log(
            `%c[MeetingRoomContext.tsx][connect#participantConnected]`,
            `color:${color.room};font-weight:bold;`,
            { participant, room: newRoom },
          )
          addParticipant(participant)
        }

        const disconnect = () => newRoom.disconnect()

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
          newRoom.localParticipant.videoTracks.forEach(unpublishTracks)
          newRoom.localParticipant.audioTracks.forEach(unpublishTracks)
          window.room = null
          // Reset the room only after all other `disconnected` listeners have been called.
          setTimeout(() => setRoom(new EventEmitter() as Room))
          window.removeEventListener('beforeunload', disconnect)
          if (isMobile()) {
            window.removeEventListener('pagehide', disconnect)
          }
        }

        // Add currently connected participants to the state
        newRoom.participants.forEach(addExistingParticipant)
        newRoom.once('disconnected', disconnected)

        const emitRemoteTracks = (participant: RemoteParticipant) => (
          trackPublication: TrackPublication,
        ) => {
          participant.emit('trackPublished', trackPublication)
          participant.emit('trackStarted', trackPublication)
          participant.emit('trackSubscribed', trackPublication)
        }

        const forEachTracks = (callback: typeof emitRemoteTracks) => (
          participant: RemoteParticipant,
        ) => participant?.tracks?.forEach?.(callback(participant))

        newRoom.participants?.forEach(forEachTracks(emitRemoteTracks))

        window.room = newRoom
        // @ts-ignore
        window.lparticipant = newRoom.localParticipant

        // console.log(
        //   `%c[MeetingRoomContext.tsx][React.useEffect] User's media devices`,
        //   `color:#3498db;font-weight:bold;`,
        //   userMedia,
        // )

        // Publish local participants tracks (self stream / local video preview)
        localTracksRef.current.forEach((track) => {
          // Tracks can be supplied as arguments to the Video.connect() function and they will automatically be published.
          // However, tracks must be published manually in order to set the priority on them.
          // All video tracks are published with 'low' priority. This works because the video
          // track that is displayed in the 'MainParticipant' component will have it's priority
          // set to 'high' via track.setPriority()
          // @ts-expect-error
          newRoom.localParticipant?.publishTrack?.(track as LocalTrack, {
            priority: track?.kind === 'video' ? 'low' : 'standard',
          })
        })

        // Add a listener to disconnect from the room when a user closes their browser
        window.addEventListener('beforeunload', disconnect)
        // Add a listener to disconnect from the room when a mobile user closes their browser
        if (isMobile()) window.addEventListener('pagehide', disconnect)

        handleWaitingOthersMessage(newRoom.participants)

        return newRoom
      } catch (error) {
        setConnecting(false)
        if (error.name === 'NotAllowedError') {
          toast.error(
            `We do not have permission to publish one or more of your devices. Please check your browser's settings if this was unintentional`,
          )
        } else {
          toast.error(error.message)
        }
        throw error
      }
    },
    // eslint-disable-next-line
    [],
  )

  React.useEffect(() => {
    if (!isRoomEnvironment) {
      if (room.state !== 'disconnected') {
        const logMsg = `%c[MeetingRoomContext.tsx][React.useEffect] Disconnecting from the room...`
        console.log(logMsg, `color:${color.room};font-weight:bold;`)
        room?.disconnect?.()
      }
    }
    return () => {
      room?.disconnect?.()
    }
  }, [isRoomEnvironment, room])

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

  return (
    <Provider
      value={{
        connect,
        connecting,
        setConnecting,
        isRoomEnvironment,
        room,
        roomState,
        localTracks,
        fetchingLocalTracks,
        getTracks,
        getLocalVideoTrack,
        getLocalAudioTrack,
        removeLocalVideoTrack,
        toggleVideo,
        toggleCamera,
        participants: { primary, secondary },
      }}
    >
      {children}
      <AttachVisibilityHandler />
    </Provider>
  )
}

export default useMeetingRoomCtx
