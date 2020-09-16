import _ from 'lodash'
import { EventEmitter } from 'events'
import {
  connect,
  ConnectOptions,
  LocalAudioTrack,
  LocalParticipant,
  LocalTrackPublication,
  LocalVideoTrack,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteVideoTrack,
  Room,
} from 'twilio-video'
import { getByDataUX, identify, NOODLComponentProps, Viewport } from 'noodl-ui'
import {
  connecting,
  connected,
  connectError,
  connectTimedOut,
} from 'features/meeting'
import { AppStore, DOMNode } from 'app/types'
import { isMobile } from 'utils/common'
import * as T from 'app/types/meetingTypes'
import Streams from 'Meeting/Streams'
import { attachVideoTrack } from 'utils/twilio'
import Page from '../Page'
import Logger from '../app/Logger'

const log = Logger.create('Meeting.ts')

interface Internal {
  _page: Page | undefined
  _store: AppStore | undefined
  _viewport: Viewport | undefined
  _room: Room
  _streams: Streams
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
    _streams: new Streams(),
    _token: '',
  } as Internal

  const o = {
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
    addParticipant(participant: T.RoomParticipant) {
      const streams = _internal._streams
      if (!streams.mainStream && !streams.subStreams.size) {
        streams.setMainStream({ participant })
        log.func('addParticipant')
        log.grey('Set participant to mainStream')
      } else {
        if (!streams.subStreams.has(participant)) {
          log.func('addParticipant')
          log.grey('Added participant as a subStream', participant)
          const node = streams.subStreams.set(participant, {
            // node:
            participant,
          })
        }
      }
      return this
    },
    removeParticipant(participant: T.RoomParticipant) {
      //
      return this
    },
    isParticipantLocal(
      participant: T.RoomParticipant,
    ): participant is LocalParticipant {
      return participant === _internal._room?.localParticipant
    },
    isParticipantMainStreaming(participant: T.RoomParticipant) {
      return !!(
        participant && _internal._streams.mainStream.participant === participant
      )
    },
    isParticipantSelfStreaming(participant: T.RoomParticipant) {
      if (this.room) {
        if (this.room.localParticipant === participant) {
          return (
            _internal._streams.selfStream?.participant ===
            this.room.localParticipant
          )
        } else {
          log.func('isParticipantSelfStreaming')
          log.red(`Expected a LocalParticipant to be passed in`)
        }
      }
      return false
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
    getSubStreamElement(): HTMLDivElement | HTMLDivElement[] | null {
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
    getStreams() {
      return _internal._streams
    },
    /**
     * Attempts to revive/re-attach both the audio and video tracks of the
     * LocalParticipant on the selfStream
     */
    refreshMainStream({
      node,
      participant,
    }: Partial<T.ParticipantStreamObject> = {}) {
      if (!node) {
        node = _internal._streams.mainStream.node || this.getMainStreamElement()
      }

      if (node) {
        _internal._streams.setMainStream({
          node,
          participant,
        } as T.ParticipantStreamObject)
      } else {
        log.func('refreshMainStream')
        log.red(
          `Tried to refresh mainStream but could not find the node anywhere`,
          { node, participant },
        )
        return this
      }

      if (!participant) {
        log.func('refreshMainStream')
        log.red(
          `Tried to refresh mainStream but received an invalid participant`,
          { node, participant },
        )
        return this
      }

      participant?.tracks?.forEach?.(
        ({ track }: T.RoomParticipantTrackPublication) => {
          if (track?.kind === 'audio') {
            node?.appendChild(track?.attach())
            log.func('refreshMainStream')
            log.green(`Attached participant's audio track to mainStream`, {
              participant,
              track,
            })
          } else if (track?.kind === 'video') {
            attachVideoTrack(node as HTMLDivElement, track)
            log.func('refreshMainStream')
            log.grey(`Attached participant's video track to mainStream`, {
              participant,
              track,
            })
          }
        },
      )

      return this
    },
    /**
     * Attempts to revive/re-attach both the audio and video tracks of the
     * LocalParticipant on the selfStream
     */
    refreshSelfStream({
      node,
      participant,
    }: Partial<T.ParticipantStreamObject> = {}) {
      if (!node) {
        node = _internal._streams.selfStream.node || o.getSelfStreamElement()
      }

      if (node) {
        _internal._streams.setSelfStream({
          node,
          participant,
        } as T.ParticipantStreamObject)
      } else {
        const msg = `Tried to refresh selfStream but could not find the node anywhere`
        log.func('refreshSelfStream')
        log.red(msg, { node, participant })
        return this
      }

      if (!participant) {
        if (this.room?.localParticipant) {
          participant = this.room.localParticipant
        } else {
          const msg = `Tried to refresh selfStream but received an invalid participant`
          log.func('refreshSelfStream')
          log.red(msg, { node, participant })
          return this
        }
      }

      if (node && participant) {
        ;(participant as LocalParticipant).tracks?.forEach((publication) => {
          if (publication.kind === 'audio') {
            //
          } else if (publication.kind === 'video') {
            const track = publication.track
            if (track) {
              attachVideoTrack(
                node as HTMLDivElement,
                publication.track as LocalVideoTrack,
              )
              log.func('refreshSelfStream')
              log.grey('Attached a video track to selfStream', track)
            } else {
              log.func('Meeting.refreshSelfStream')
              log.red(
                `Tried to attach a video track to the selfStream but no videoTrack ` +
                  `was available`,
                { node, participant },
              )
            }
          }
        })
      } else {
        if (!node) {
          const msg = `Tried to refresh selfStream but it was not found on the Streams instance`
          log.func('refreshSelfStream')
          log.red(msg, {
            node,
            participant,
            selfStreamObject: _internal._streams.selfStream,
          })
        }
      }
      return this
    },
    /**
     * Attaches a track to a DOM node
     * @param { RoomTrack } track - Track from the room instance
     * @param { RoomParticipant } participant - Participant from the room instance
     */
    attachTrack(track: T.RoomTrack, participant: T.RoomParticipant) {
      if (track.kind === 'audio') {
        //
      } else if (track.kind === 'video') {
        if (!_internal._streams.subStreams.has(participant)) {
          //
        }
      }
      return this
    },
    /**
     * Removes a track from a DOM node
     * @param { RoomTrack } track - Track from the room instance
     * @param { RoomParticipant } participant - Participant from the room instance
     */
    detachTrack(track: T.RoomTrack, participant: T.RoomParticipant) {
      if (!Meeting.isParticipantLocal(participant)) {
        if (track.kind === 'audio') {
          //
        } else if (track.kind === 'video') {
          //
        }
      }
      return this
    },
  }

  return o as typeof o & {
    onConnected(room: Room): any
  }
})()

export default Meeting
