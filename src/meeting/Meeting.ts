import _ from 'lodash'
import { EventEmitter } from 'events'
import {
  connect,
  ConnectOptions,
  LocalAudioTrack,
  LocalParticipant,
  LocalTrack,
  RemoteTrack,
  Room,
} from 'twilio-video'
import { getByDataUX, Viewport } from 'noodl-ui'
import { AppStore } from 'app/types'
import { isMobile } from 'utils/common'
import { forEachParticipant, forEachParticipantTrack } from 'utils/twilio'
import * as T from 'app/types/meeting'
import Page from '../Page'
import makeDominantSpeaker, {
  AppDominantSpeaker,
  DominantSpeaker,
} from './makeDominantSpeaker'
import makeLocalTracks, { AppLocalTracks } from './makeLocalTracks'
import makeParticipants, { AppParticipants } from './makeParticipants'
import makeRoom, { AppRoom } from './makeRoom'
import Logger from '../app/Logger'

const log = Logger.create('Meeting.ts')

// import makePublications from './makePublications'
// import makeTrack from './makeTrack'

export interface InitializeMeetingOptions {
  store: AppStore
  page: Page
  viewport: Viewport
}

const Meeting = (function () {
  let _page: Page
  let _store: AppStore
  let _viewport: Viewport
  let _room: Room = new EventEmitter() as Room

  const o = {
    initialize({ store, page, viewport }: InitializeMeetingOptions) {
      _store = store
      _page = page
      _viewport = viewport
    },
    /**
     * Joins and returns the room using the token
     * @param { string } token - Room token
     * @param { ConnectOptions? } options - Options passed to the connect call
     */
    async join(token: string, options?: ConnectOptions) {
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
      // _handleRoomCreated(room)s
      log.cyan('Meeting nodes', o.getAllNodes())
    },
    leave() {
      _room?.disconnect?.()
      return this
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
    getAllNodes() {
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
  }

  /**
   * Begins initializing media tracks and listeners immediately after the room
   * is created.
   * @param { Room } room - Room instance
   */
  function _handleRoomCreated(room: Room) {
    forEachParticipant(room.participants, _handleTrackPublish)
  }

  /**
   * Handle tracks published as well as tracks that are going to be published
   * by the participant later
   * @param { LocalParticipant | RemoteParticipant } participant
   */
  function _handleTrackPublish(participant: T.RoomParticipant) {
    const onTrackPublished = _.partialRight(_handleTrackAttach, participant)
    forEachParticipantTrack(participant.tracks, onTrackPublished)
    participant.on('trackPublished', onTrackPublished)
  }

  /**
   * Attach the published track to the DOM once it is subscribed
   * @param { RoomParticipantTrackPublication } publication - Track publication
   * @param { RoomParticipant } participant
   */
  function _handleTrackAttach(
    publication: T.RoomParticipantTrackPublication,
    participant: T.RoomParticipant,
  ) {
    // If the TrackPublication is already subscribed to, then attach the Track to the DOM.
    if (publication.track) {
      _attachTrack(publication.track, participant)
    }
    // Local participant is subscribed to this remote track
    publication.on('subscribed', _.partialRight(_attachTrack, participant))
    publication.on('unsubscribed', _.partialRight(_detachTrack, participant))
  }

  /**
   * Attaches a track to the DOM
   * @param { RoomTrack } track - Track from the room instance
   * @param { RoomParticipant } participant - Participant from the room instance
   */
  function _attachTrack(track: T.RoomTrack, participant: T.RoomParticipant) {
    log.func('_attachTrack')
    if (_isLocalParticipant(participant)) {
      // TODO: attach to selfStream element
      if (track.kind !== 'data') {
        const selfStreamElem = o.getSelfStreamElement()
        if (selfStreamElem) {
          track.attach(selfStreamElem)
        } else {
          log.red(
            `Tried to attach a ${track.kind} track to the selfStream but could ` +
              `not find DOM node`,
            participant,
          )
        }
      }
    } else {
      //
    }
  }

  /**
   * Removes a track from the DOM
   * @param { RoomTrack } track - Track from the room instance
   * @param { RoomParticipant } participant - Participant from the room instance
   */
  function _detachTrack(track: T.RoomTrack, participant: T.RoomParticipant) {
    log.func('_detachTrack')
    if (_isLocalParticipant(participant)) {
      if (track.kind !== 'data') {
        const selfStreamElem = o.getSelfStreamElement()
        if (selfStreamElem) {
          track.detach(selfStreamElem)
        } else {
          log.red(
            `Tried to detach a ${track.kind} track to the selfStream but could ` +
              `not find DOM node`,
            { participant, track },
          )
        }
      }
    }
  }

  function _isLocalParticipant(
    participant: T.RoomParticipant,
  ): participant is LocalParticipant {
    return participant === _room?.localParticipant
  }

  return o
})()

export default Meeting
