import _ from 'lodash'
import { EventEmitter } from 'events'
import {
  connect,
  ConnectOptions,
  LocalParticipant,
  LocalVideoTrack,
  RemoteParticipant,
  Room,
  TrackPublication,
} from 'twilio-video'
import { getByDataUX, Viewport } from 'noodl-ui'
import {
  connecting,
  connected,
  connectError,
  connectTimedOut,
} from 'features/meeting'
import { AppStore } from 'app/types'
import { isMobile } from 'utils/common'
import * as T from 'app/types/meetingTypes'
import Page from '../Page'
import Logger from '../app/Logger'

const log = Logger.create('Meeting.ts')

interface Internal {
  _page: Page | undefined
  _store: AppStore | undefined
  _viewport: Viewport | undefined
  _room: Room
  _token: string
}

// import makePublications from './makePublications'
// import makeTrack from './makeTrack'

const Meeting = (function () {
  const _internal: Internal = {
    _page: undefined,
    _store: undefined,
    _viewport: undefined,
    _room: new EventEmitter() as Room,
    _token: '',
  } as Internal

  const o: T.IMeeting = {
    initialize({ store, page, viewport }: T.InitializeMeetingOptions) {
      _internal['_store'] = store
      _internal['_page'] = page
      _internal['_viewport'] = viewport
      return this
    },
    /**
     * Joins and returns the room using the token
     * @param { string } token - Room token
     * @param { ConnectOptions? } options - Options passed to the connect call
     */
    async join(token: string, options?: ConnectOptions) {
      try {
        _internal['_token'] = token
        _internal._store?.dispatch(connecting())
        // TODO - timeout
        const room = await connect(token, {
          dominantSpeaker: true,
          logLevel: 'info',
          ...options,
          bandwidthProfile: {
            ...options?.bandwidthProfile,
            video: {
              dominantSpeakerPriority: 'high',
              mode: 'collaboration',
              // For mobile browsers, limit the maximum incoming video bitrate to 2.5 Mbps
              ...(isMobile() ? { maxSubscriptionBitrate: 2500000 } : undefined),
              ...options?.bandwidthProfile?.video,
            },
          },
        })
        _internal['_room'] = room
        _internal._store?.dispatch(connected())
        // TEMPORARY
        setTimeout(() => {
          Meeting.onConnected?.(room)
        }, 2000)
        // _handleRoomCreated
        return _internal._room
      } catch (error) {
        _internal._store?.dispatch(connectError(error))
        throw error
      }
    },
    leave() {
      _internal._room?.disconnect?.()
      return this
    },
    isLocalParticipant(
      participant: T.RoomParticipant,
    ): participant is LocalParticipant {
      return participant === _internal._room?.localParticipant
    },
    get room() {
      return _internal._room
    },
    resetRoom() {
      _internal._room = new EventEmitter() as Room
      return this
    },
    get token() {
      return _internal._token
    },
    set token(token: string) {
      _internal._token = token
    },
    /** Element used for the dominant/main speaker */
    getMainStreamElement(): HTMLDivElement | null {
      return getByDataUX('mainStream') as HTMLDivElement
    },
    /** Element that the local participant uses (self mirror) */
    getSelfStreamElement(): HTMLDivElement | null {
      return getByDataUX('selfStream') as HTMLDivElement
    },
    /** Element that renders a remote participant into the participants list */
    getSubStreamElement(): HTMLDivElement | null {
      return getByDataUX('subStream') as HTMLDivElement
    },
    /** Element that toggles the camera on/off */
    getCameraElement(): HTMLImageElement | null {
      return getByDataUX('camera') as HTMLImageElement
    },
    /** Element that toggles the microphone on/off */
    getMicrophoneElement(): HTMLImageElement | null {
      return getByDataUX('microphone') as HTMLImageElement
    },
    /** Element that completes the meeting when clicked */
    getHangUpElement(): HTMLImageElement | null {
      return getByDataUX('hangUp') as HTMLImageElement
    },
    /** Element to invite other participants into the meeting */
    getInviteOthersElement(): HTMLImageElement | null {
      return getByDataUX('inviteOthers') as HTMLImageElement
    },
    /** Element that renders a list of remote participants on the bottom */
    getParticipantsListElement(): HTMLUListElement | null {
      return getByDataUX('vidoeSubStream') as HTMLUListElement
    },
    getVideoChatElements() {
      return {
        mainStream: o.getMainStreamElement(),
        selfStream: o.getSelfStreamElement(),
        subStream: o.getSubStreamElement(),
        camera: o.getCameraElement(),
        microphone: o.getMicrophoneElement(),
        hangUp: o.getHangUpElement(),
        inviteOthers: o.getInviteOthersElement(),
        vidoeSubStream: o.getParticipantsListElement(),
      }
    },
  } as T.IMeeting

  /**
   * Begins initializing media tracks and listeners immediately after the room
   * is created.
   * @param { Room } room - Room instance
   */
  function _handleRoomCreated(room: Room) {
    // Initialize the selfStream component
    const selfStreamElem = Meeting.getSelfStreamElement()
    if (selfStreamElem) {
      const publications = Array.from(room.localParticipant?.tracks?.values?.())
      const publication = _.find(publications, (p) => p.kind === 'video')
      const videoTrack = publication?.track as LocalVideoTrack
      console.log(videoTrack)
      console.log(videoTrack)
      if (videoTrack) {
        // TODO: attach to selfStream element
        const videoElem = videoTrack.attach()
        if (!selfStreamElem.contains(videoElem)) {
          selfStreamElem.appendChild(videoElem)
        }
      } else {
        log.func('_handleRoomCreated')
        log.red(
          `Tried to attach a video track to the selfStream but no videoTrack ` +
            `was available`,
          room.localParticipant,
        )
      }
    } else {
      log.func('_handleRoomCreated')
      log.red(
        `Attempted to attach your video to the selfStream but could not find the ` +
          `selfStream node`,
      )
    }

    // Experimental
    const emitRemoteTracks = (participant: RemoteParticipant) => (
      trackPublication: TrackPublication,
    ) => {
      participant.emit('trackPublished', trackPublication)
      participant.emit('trackStarted', trackPublication)
      participant.emit('trackSubscribed', trackPublication)
    }

    // Experimental
    const forEachTracks = (callback: typeof emitRemoteTracks) => (
      participant: RemoteParticipant,
    ) => participant?.tracks?.forEach?.(callback(participant))
    // Experimental
    room.participants?.forEach(forEachTracks(emitRemoteTracks))

    window.room = room
    window.lparticipant = room.localParticipant
  }

  return o
})()

export default Meeting
