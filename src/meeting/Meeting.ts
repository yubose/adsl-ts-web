import _ from 'lodash'
import { EventEmitter } from 'events'
import {
  connect,
  ConnectOptions,
  LocalParticipant,
  RemoteParticipant,
  Room,
} from 'twilio-video'
import { getByDataUX, NOODLComponentProps, Viewport } from 'noodl-ui'
import { AppStore } from 'app/types'
import { isMobile } from 'utils/common'
import parser from 'utils/parser'
import * as T from 'app/types/meetingTypes'
import Stream from 'meeting/Stream'
import Streams from 'meeting/Streams'
import Logger from 'app/Logger'
import Page from 'Page'
import MeetingSubstreams from './Substreams'

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
        // TEMPORARY
        setTimeout(() => {
          Meeting.onConnected?.(room)
        }, 2000)
        // _handleRoomCreated
        return _internal._room
      } catch (error) {
        throw error
      }
    },
    /** Disconnects from the room */
    leave() {
      _internal._room?.disconnect?.()
      return this
    },
    /**
     * Adds a remote participant to the sdk and the internal state
     * @param { RemoteParticipant } participant
     */
    addRemoteParticipant(participant: T.RoomParticipant) {
      if (_internal._room?.state === 'connected') {
        if (!o.isParticipantLocal(participant)) {
          const mainStream = _internal._streams?.getMainStream()
          const subStreams = _internal._streams?.getSubStreamsContainer()
          if (mainStream.isSameParticipant(participant)) {
            // Safe checking -- remove the participant from a subStream if they
            // are in an existing one for some reason
            if (subStreams?.participantExists(participant)) {
              let subStream = subStreams.findBy((s) =>
                s.isSameParticipant(participant),
              )
              if (subStream) {
                subStream.unpublish()
                subStream.removeElement()
                subStreams.removeSubStream(subStream)
              }
            }
            return this
          }
          // Just set the participant as the mainStream  since it's open
          if (!mainStream.isAnyParticipantSet()) {
            mainStream.setParticipant(participant)
            Meeting.onAddRemoteParticipant?.(participant, mainStream)
            return this
          }

          if (subStreams) {
            if (!subStreams.participantExists(participant)) {
              log.func('addRemoteParticipant')
              // Create a new DOM node
              const props = subStreams.blueprint
              const node = parser.parse(props as NOODLComponentProps)
              const subStream = subStreams.add({ node, participant }).last()
              Meeting.onAddRemoteParticipant?.(participant, mainStream)
              log.green(
                `Created a new subStream and bound the newly connected participant to it`,
                { blueprint: props, node, participant, subStream },
              )
            } else {
              log.func('addRemoteParticipant')
              log.orange(
                `Did not proceed to add this remotes participant to a ` +
                  `subStream because they are already in one`,
              )
            }
          } else {
            // NOTE: We cannot create a container here because the container is
            // only created while rendering/parsing the NOODL components. It should
            // stay that way to reduce complexity
            log.func('addRemoteParticipant')
            log.red(
              `Cannot add participant without the subStreams container, ` +
                `which doesn't exist. This participant will not be shown on ` +
                `the page`,
              { participant, streams: _internal._streams },
            )
          }
        } else {
          log.func('addRemoteParticipant')
          log.red('This call is intended for remote participants')
        }
      }
      return this
    },
    removeRemoteParticipant(participant: T.RoomParticipant) {
      if (participant && !o.isParticipantLocal(participant)) {
        let mainStream: Stream | null = _internal._streams.getMainStream()
        let subStreams: MeetingSubstreams | null = _internal._streams?.getSubStreamsContainer()
        let subStream: Stream | null | undefined = null

        if (_internal._streams?.isMainStreaming?.(participant)) {
          log.func('removeRemoteParticipant')
          log.orange(
            'This participant was mainstreaming. Removing it from mainStream now',
          )
          mainStream = _internal._streams.getMainStream()
          mainStream.unpublish().detachParticipant()
          Meeting.onRemoveRemoteParticipant?.(participant, mainStream)

          let nextMainParticipant: T.RoomParticipant | null

          if (subStreams) {
            subStream = subStreams.findBy((stream) =>
              stream.isAnyParticipantSet(),
            )
            // The next participant in the subStreams collection will move to be
            // the new dominant speaker if the participant we are removing is the
            // current dominant speaker
            if (subStream) {
              // Remove the incoming mainStreamer from subStreams and bind them
              // to the mainStream
              nextMainParticipant = subStream.getParticipant()
              if (nextMainParticipant) {
                subStream.unpublish().detachParticipant()
                // TODO - Loop over the rest of the subStreams and see if theres
                // an out-of-ordered stream where a participant is bound to if
                // nextMainParticipant is undefined/null the first time
                mainStream.setParticipant(nextMainParticipant)
                log.func('removeRemoteParticipant')
                log.green(`Bound the next immediate participant to mainStream`)
                subStreams?.removeSubStream(subStream)
                log.green(
                  `Removed inactive subStream from the subStreams collection`,
                )
              } else {
                log.func('removeRemoteParticipant')
                log.grey(
                  `No other participant was found in any of the subStreams collection`,
                )
              }
            } else {
              log.func('removeRemoteParticipant')
              log.grey(
                `No participant is subStreaming right now and the mainStream ` +
                  `will remain empty`,
              )
            }
          } else {
            log.func('removeRemoteParticipant')
            log.red(
              `The subStreams container was not initiated. Nothing else will happen`,
            )
          }
        } else if (_internal._streams?.isSubStreaming(participant)) {
          log.func('removeRemoteParticipant')
          log.orange('This remote participant was substreaming')
          subStream = subStreams?.findBy((stream) =>
            stream.isSameParticipant(participant),
          )
          if (subStream) {
            console.info(subStream)
            subStream.unpublish().detachParticipant().removeElement()
            subStreams?.removeSubStream(subStream)
            Meeting.onRemoveRemoteParticipant?.(participant, subStream)
          }
        }
      }
      return this
    },
    /**
     * Returns true if the participant is the LocalParticipant
     * @param { RoomParticipant } participant
     */
    isParticipantLocal(
      participant: T.RoomParticipant,
    ): participant is LocalParticipant {
      return participant === _internal._room?.localParticipant
    },
    resetRoom() {
      _internal._room = new EventEmitter() as Room
      return this
    },
    get room() {
      return _internal._room
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
     * Wipes the entire internal state including the store. This is mainly just
     * used for testing
     */
    reset() {
      _.assign(_internal, {
        _page: undefined,
        _store: undefined,
        _viewport: undefined,
        _room: new EventEmitter() as Room,
        _streams: new Streams(),
        _token: '',
      })
      return this
    },
    removeFalseyParticipants(participants: any[]) {
      return _.filter(participants, (p) => !!p?.sid)
    },
  }

  // Helpers for unit testing
  if (process.env.NODE_ENV === 'test') {
    // @ts-expect-error
    o.getInternal = () => _internal
    // @ts-expect-error
    o.setInternal = (opts: typeof _internal) => void _.assign(_internal, opts)
  }

  return o as typeof o & {
    onConnected(room: Room): any
    onAddRemoteParticipant(participant: RemoteParticipant, stream: Stream): any
    onRemoveRemoteParticipant(
      participant: RemoteParticipant,
      stream: Stream,
    ): any
    getInternal?(): typeof _internal
    setInternal?(opts: typeof _internal): void
  }
})()

export default Meeting
