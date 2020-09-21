import _ from 'lodash'
import { EventEmitter } from 'events'
import { Draft } from 'immer'
import {
  connect,
  ConnectOptions,
  LocalParticipant,
  RemoteParticipant,
  Room,
} from 'twilio-video'
import { getByDataUX, NOODLComponentProps, Viewport } from 'noodl-ui'
import {
  connecting,
  connected,
  connectError,
  connectTimedOut,
} from 'features/meeting'
import { cadl } from 'app/client'
import { AppStore } from 'app/types'
import { isMobile } from 'utils/common'
import createElement from 'utils/createElement'
import parser from 'utils/parser'
import * as T from 'app/types/meetingTypes'
import Stream from 'meeting/Stream'
import Streams from 'meeting/Streams'
import Page from '../Page'
import Logger from '../app/Logger'
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

  function _addRemoteParticipantToStream(
    stream: Stream,
    participant: RemoteParticipant,
  ) {
    const pageName = _internal._store?.getState?.()?.page?.currentPage
    if (pageName) {
      const isInSdk = _.some(
        cadl.root?.[pageName]?.listData?.participants || [],
        (p) => p.sid === participant.sid,
      )
      if (!isInSdk) {
        cadl.editDraft((draft: Draft<typeof cadl.root>) => {
          const listData = draft.root?.[pageName]?.listData
          if (_.isArray(listData?.participants)) {
            listData.participants.push(participant)
            log.func('_addRemoteParticipantToStream')
            log.green('Added remote participant to SDK internal state')
          } else {
            log.func('_addRemoteParticipantToStream')
            log.red(
              'Tried to update the internal state on the SDK but the list data ' +
                'could not be found',
              { localRoot: cadl.root?.[pageName], participant, stream },
            )
          }
        })
      }
      stream.setParticipant(participant)
      log.func('_addRemoteParticipantToStream')
      log.green(`Bound remote participant to ${stream.type}`, {
        participant,
        stream,
      })
    } else {
      log.func('_addRemoteParticipantToStream')
      log.red(
        'Attempted to add a remote participant but could not find the page ' +
          'name for it',
        participant,
      )
    }

    const mainStream = _internal._streams?.getMainStream()
    const subStreams = _internal._streams?.getSubStreamsContainer()
    if (!mainStream.hasParticipant()) {
      // Assign them to mainStream
      mainStream.setParticipant(participant)
    } else {
      if (subStreams) {
        if (!subStreams.participantExists(participant)) {
          // Create a new DOM node
          const props = subStreams.blueprint
          const node = parser.parse(props as NOODLComponentProps)
          const subStream = subStreams.add({ node, participant }).last()
          log.func('addParticipant')
          log.green(
            `Created a new subStream and bound the newly connected participant to it`,
            { participant, subStream },
          )
        }
      } else {
        log.func('addParticipant')
        log.red(
          `Attempted to bind a remote participant on a subStream but the container ` +
            `was not available`,
          { streams: _internal._streams, participant },
        )
      }
    }
  }

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
    addRemoteParticipant(participant: T.RoomParticipant) {
      if (_internal._room?.state === 'connected') {
        if (!o.isParticipantLocal(participant)) {
          const mainStream = _internal._streams?.getMainStream()
          // If the mainStream doesn't have any participant bound to it
          if (!mainStream.hasParticipant()) {
            _addRemoteParticipantToStream(mainStream, participant)
          }
          // Otherwise if the participant is not currently the main speaker,
          // proceed with adding them to the subStreams collection
          else if (!mainStream.isSameParticipant(participant)) {
            let subStreams = _internal._streams?.getSubStreamsContainer()
            // Do one more check and attempt to grab a subStream that has
            // the participant bound to it if there is one
            const subStream = subStreams?.getSubStream(participant)
            if (!subStream) {
              // Proceed to add this participant to the collection. This will
              // create a brand new stream instance by default if it doesn't
              // find a participant bound to any streams
              if (subStreams) {
                subStreams.addParticipant(participant)
              } else {
                // NOTE: This block might never run
                log.func('addRemoteParticipant')
                log.grey(
                  `No subStreams container was found for this participant. ` +
                    `This participant will not be shown on the page`,
                  { participant, streams: _internal._streams },
                )
                // NOTE: We can't create a custom container here because the only way
                // the container is created is through onCreateNode
              }
            }
          }
        } else {
          log.func('addRemoteParticipant')
          log.red('This call is intended for remote participants')
        }
      }
      return this
    },
    removeRemoteParticipant(participant: T.RoomParticipant) {
      if (_internal._room?.state === 'connected') {
        if (!o.isParticipantLocal(participant)) {
          let mainStream: Stream | null = _internal._streams.getMainStream()
          let subStreams: MeetingSubstreams | null = _internal._streams?.getSubStreamsContainer()
          let subStream: Stream | null | undefined = null

          // RemoteParticipant
          if (_internal._streams?.isMainStreaming?.(participant)) {
            log.func('removeRemoteParticipant')
            log.orange('This participant was mainstreaming')
            mainStream = _internal._streams.getMainStream()
            mainStream.unpublish()
            const subStream = subStreams?.first()
            let nextMainParticipant: T.RoomParticipant | null
            if (subStream) {
              nextMainParticipant = subStream.getParticipant()
              if (nextMainParticipant) {
              } else {
              }
            }
            // The next participant in the subStreams collection will move to be
            // the new dominant speaker if the participant we are removing is the
            // current dominant speaker
            if (subStreams) {
              if (subStreams.length) {
                const nextSubStream = subStreams.first()
                const nextParticipant = nextSubStream.getParticipant()
                if (nextParticipant) {
                  mainStream.setParticipant(nextParticipant)
                } else {
                  // TODO - loop until a participant is available
                }
                const subStream = subStreams.getSubStream(participant)
                if (subStream) {
                  subStreams.removeSubStream(subStream)
                  log.func('removeRemoteParticipant')
                  log.green(
                    `Removed participant's stream from the subStreams collection`,
                    participant,
                  )
                }
              }
            }
          }
          // RemoteParticipant
          else if (_internal._streams?.isSubStreaming(participant)) {
            log.func('removeRemoteParticipant')
            log.orange('This remote participant was substreaming')
            subStream = subStreams?.getSubStream(participant)
            if (subStream) subStreams?.removeSubStream(subStream)
          }
        } else {
          log.func('removeRemoteParticipant')
          log.red('This call is intended for remote participants')
        }
      }
      return this
    },
    isParticipantLocal(
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
  }

  return o as typeof o & {
    onConnected(room: Room): any
  }
})()

export default Meeting
