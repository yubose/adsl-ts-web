import _, { partialRight } from 'lodash'
import { EventEmitter } from 'events'
import {
  connect,
  ConnectOptions,
  LocalAudioTrack,
  LocalParticipant,
  LocalTrackPublication,
  LocalVideoTrack,
  RemoteParticipant,
  RemoteVideoTrack,
  Room,
} from 'twilio-video'
import { getByDataUX, Viewport } from 'noodl-ui'
import {
  connecting,
  connected,
  connectError,
  connectTimedOut,
} from 'features/meeting'
import { AppStore, DOMNode } from 'app/types'
import { isMobile } from 'utils/common'
import * as T from 'app/types/meetingTypes'
import Streams from 'meeting/Streams'
import Page from '../Page'
import Logger from '../app/Logger'
import { attachVideoTrack } from 'utils/twilio'

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

  const _streams = new Streams()

  function _addParticipant(participant: RemoteParticipant) {}

  /**
   * Retrieves a stream element using the data-ux tag.
   * This also handles updates to adding/removing streams as observers
   * @param { string } uxTag - data-ux tag
   */
  function _getStreamElem(uxTag: string) {
    const node = getByDataUX(uxTag)
    if (node) {
      switch (uxTag) {
        case 'mainStream':
          return _streams.mainStream
        case 'selfStream':
          return _streams.selfStream
        case 'subStream':
        case 'vidoeSubStream':
        default:
          break
      }
    }
    return node
  }

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
    isParticipantLocal(
      participant: T.RoomParticipant,
    ): participant is LocalParticipant {
      return participant === _internal._room?.localParticipant
    },
    isParticipantMainStreaming(participant: T.RoomParticipant) {
      return !!(participant && _streams.mainStream.participant === participant)
    },
    isParticipantSelfStreaming(participant: T.RoomParticipant) {
      if (this.room) {
        if (this.room.localParticipant === participant) {
          return _streams.selfStream?.participant === this.room.localParticipant
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
    getStreamsController() {
      return _streams
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
        node = _streams.mainStream.node || this.getMainStreamElement()
      }

      if (node) {
        _streams.setMainStream({
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

      ;(participant as RemoteParticipant).tracks?.forEach((publication) => {
        if (publication.kind === 'audio') {
          //
        } else if (publication.kind === 'video') {
          const track = publication.track
          if (track) {
            attachVideoTrack(
              node as HTMLDivElement,
              publication.track as RemoteVideoTrack,
            )
            log.func('refreshMainStream')
            log.grey('Attached video track to mainStream', track)
          } else {
            log.func('refreshMainStream')
            log.red(
              `Tried to attach a video track to the mainStream but no videoTrack ` +
                `was available`,
              participant,
            )
          }
        }
      })

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
        node = _streams.selfStream.node || o.getSelfStreamElement()
      }

      if (node) {
        _streams.setSelfStream({
          node,
          participant,
        } as T.ParticipantStreamObject)
      } else {
        log.func('refreshSelfStream')
        log.red(
          `Tried to refresh selfStream but could not find the node anywhere`,
          { node, participant },
        )
        return this
      }

      if (!participant) {
        if (this.room?.localParticipant) {
          participant = this.room.localParticipant
        } else {
          log.func('refreshSelfStream')
          log.red(
            `Tried to refresh selfStream but received an invalid participant`,
            { node, participant },
          )
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
          log.func('refreshSelfStream')
          log.red(
            `Tried to refresh selfStream but it was not found on the Streams instance`,
            { node, participant, selfStreamObject: _streams.selfStream },
          )
        }
      }
      return this
    },
  } as T.IMeeting

  return o
})()

export default Meeting
