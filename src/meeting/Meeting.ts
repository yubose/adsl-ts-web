import { EventEmitter } from 'events'
import {
  connect,
  ConnectOptions,
  createLocalVideoTrack,
  LocalAudioTrackPublication,
  createLocalAudioTrack,
  LocalParticipant,
  LocalVideoTrackPublication,
  RemoteParticipant,
  Room,
  LocalAudioTrack,
  LocalVideoTrack,
} from 'twilio-video'
import Logger from 'logsnap'
import { getFirstByViewTag, findByUX, Page } from 'noodl-ui-dom'
import { array, isMobile } from '../utils/common'
import { hide, show, toast } from '../utils/dom'
import App from '../App'
import Stream from '../meeting/Stream'
import Streams from '../meeting/Streams'
import MeetingSubstreams from '../meeting/Substreams'
import * as T from '../app/types/meetingTypes'

const log = Logger.create('Meeting.ts')

// import makePublications from './makePublications'
// import makeTrack from './makeTrack'

const createMeetingFns = function _createMeetingFns(app: App) {
  let _room = new EventEmitter() as Room
  let _streams = new Streams()

  async function _createRoom(token: string) {
    return connect(token, {
      dominantSpeaker: true,
      logLevel: 'info',
      tracks: [],
      bandwidthProfile: {
        video: {
          dominantSpeakerPriority: 'high',
          mode: 'collaboration',
          // For mobile browsers, limit the maximum incoming video bitrate to 2.5 Mbps
          ...(isMobile() ? { maxSubscriptionBitrate: 2500000 } : undefined),
        },
      },
    })
  }

  async function _startTracks() {
    function handleTrackErr(kind: 'audio' | 'video', err: Error) {
      let errMsg = ''
      if (/NotAllowedError/i.test(err.name)) {
        errMsg = `Permission to your ${kind} device was denied.`
      } else if (/NotFoundError/i.test(err.name)) {
        errMsg = `Could not locate your ${kind} device.`
      } else if (/NotReadableError/i.test(err.name)) {
        errMsg = `Failed to start your ${kind} device. It may be busy or is being used by another tab.`
      } else {
        errMsg = err.message
      }
      console.error(err)
      toast(errMsg, { type: 'error' })
    }
    try {
      _room.localParticipant.publishTrack(await createLocalAudioTrack())
    } catch (error) {
      handleTrackErr('audio', error)
    }
    try {
      _room.localParticipant.publishTrack(await createLocalVideoTrack())
    } catch (error) {
      handleTrackErr('video', error)
    }
  }

  const o = {
    get localParticipant() {
      return _room?.localParticipant
    },
    get room() {
      return _room
    },
    get streams() {
      return _streams
    },
    /**
     * Joins and returns the room using the token
     * @param { string } token - Room token
     */
    async join(token: string) {
      try {
        if (!_room) {
          _room = await _createRoom(token)
        } else {
          _room.state === 'disconnected' && o.leave()
          _room = await _createRoom(token)
        }
        await _startTracks()
        setTimeout(() => app.meeting.onConnected?.(_room), 2000)
        return _room
      } catch (error) {
        console.error(error)
        toast(error.message, { type: 'error' })
      }
    },
    hideWaitingOthersMessage() {
      app.meeting.getWaitingMessageElements().forEach((node) => hide(node))
    },
    showWaitingOthersMessage() {
      app.meeting.getWaitingMessageElements().forEach((node) => show(node))
    },
    /** Disconnects from the room */
    leave() {
      log.func('leave')
      log.red(`LEAVING MEETING ROOM`, new Error('test').stack)
      if (_room?.state) {
        const unpublishTracks = (
          trackPublication:
            | LocalVideoTrackPublication
            | LocalAudioTrackPublication,
        ) => {
          trackPublication?.track?.stop?.()
          trackPublication?.unpublish?.()
        }
        // Unpublish local tracks
        _room?.localParticipant?.audioTracks.forEach(unpublishTracks)
        _room?.localParticipant?.videoTracks.forEach(unpublishTracks)
        _room?.disconnect?.()
      }
      return this
    },
    /**
     * Adds a remote participant to the sdk and the internal state
     * @param { RemoteParticipant } participant
     * @param { object } options - This is temporarily used for debugging
     */
    addRemoteParticipant(
      participant: T.RoomParticipant,
      {
        force = '',
      }: {
        force?: 'mainStream' | 'selfStream' | 'subStream' | '' | boolean
      } = {},
    ) {
      if (_room?.state === 'connected') {
        if (force || !o.isParticipantLocal(participant)) {
          const { mainStream, subStreams } = _streams
          if (!force && mainStream.isSameParticipant(participant)) {
            if (!subStreams?.participantExists(participant)) {
              let subStream = subStreams?.findByParticipant(participant)
              if (subStream) {
                subStream?.unpublish()
                subStream?.removeElement()
                subStreams?.removeSubStream(subStream)
              }
            }
            return this
          }
          // Just set the participant as the mainStream  since it's open
          if (!mainStream.hasParticipant()) {
            mainStream.setParticipant(participant)
            app.meeting.onAddRemoteParticipant?.(
              participant as RemoteParticipant,
              mainStream,
            )
            return this
          }

          if (subStreams) {
            if (
              force === 'subStream' ||
              !subStreams.participantExists(participant)
            ) {
              log.func('addRemoteParticipant')
              // Create a new DOM node
              const props = subStreams.blueprint
              const node = app.ndom.draw(
                subStreams.resolver?.(props) || props,
              ) as any
              const subStream = subStreams
                .create({ node, participant: participant as RemoteParticipant })
                .last()
              app.meeting.onAddRemoteParticipant?.(
                participant as RemoteParticipant,
                mainStream,
              )
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
              { participant, streams: _streams },
            )
          }
        }
      }
      return this
    },
    removeRemoteParticipant(
      participant: T.RoomParticipant,
      { force }: { force?: boolean } = {},
    ) {
      if (participant && (force || !o.isParticipantLocal(participant))) {
        let mainStream: Stream | null = _streams.mainStream
        let subStreams: MeetingSubstreams | null = _streams?.getSubStreamsContainer()
        let subStream: Stream | null | undefined = null

        if (mainStream.isSameParticipant?.(participant)) {
          log.func('removeRemoteParticipant')
          log.orange(
            'This participant was mainstreaming. Removing it from mainStream now',
          )
          // NOTE: Be careful not to call mainStream.removeElement() here.
          // In the NOODL the mainStream is part of the page. For subStreams,
          // since we create them customly and are not included in the NOODL, we
          // would call subStream.removeElement() for those
          mainStream?.unpublish().detachParticipant()
          app.meeting.onRemoveRemoteParticipant?.(
            participant as RemoteParticipant,
            mainStream,
          )

          let nextMainParticipant: T.RoomParticipant | null

          if (subStreams) {
            subStream = subStreams.findBy((stream: Stream) =>
              stream.hasParticipant(),
            )
            // The next participant in the subStreams collection will move to be
            // the new dominant speaker if the participant we are removing is the
            // current dominant speaker
            if (subStream) {
              // Remove the incoming mainStreamer from subStreams and bind them
              // to the mainStream
              nextMainParticipant = subStream.getParticipant()
              if (nextMainParticipant) {
                subStream?.unpublish().detachParticipant().removeElement()
                mainStream.setParticipant(nextMainParticipant)
                log.func('removeRemoteParticipant')
                log.green(
                  `Bound the next immediate participant to mainStream`,
                  { mainStream, participant: nextMainParticipant },
                )
                subStreams?.removeSubStream(subStream)
              }
            }
          }
        } else if (_streams?.isSubStreaming(participant)) {
          log.func('removeRemoteParticipant')
          log.orange('This remote participant was substreaming')
          subStream = subStreams?.findByParticipant(participant)
          if (subStream) {
            subStream.unpublish().detachParticipant().removeElement()
            subStreams?.removeSubStream(subStream)
            app.meeting.onRemoveRemoteParticipant?.(
              participant as RemoteParticipant,
              subStream,
            )
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
      return participant === _room?.localParticipant
    },
    resetRoom() {
      _room = new EventEmitter() as Room
      return this
    },
    /** Element used for the dominant/main speaker */
    getMainStreamElement(): HTMLDivElement | null {
      return getFirstByViewTag('mainStream') as HTMLDivElement
    },
    /** Element that the local participant uses (self mirror) */
    getSelfStreamElement(): HTMLDivElement | null {
      return getFirstByViewTag('selfStream') as HTMLDivElement
    },
    /** Element that renders a remote participant into the participants list */
    getSubStreamElement(): HTMLDivElement | HTMLDivElement[] | null {
      return getFirstByViewTag('subStream') as HTMLDivElement
    },
    /** Element that toggles the camera on/off */
    getCameraElement(): HTMLImageElement | null {
      return getFirstByViewTag('camera') as HTMLImageElement
    },
    /** Element that toggles the microphone on/off */
    getMicrophoneElement(): HTMLImageElement | null {
      return getFirstByViewTag('microphone') as HTMLImageElement
    },
    /** Element that completes the meeting when clicked */
    getHangUpElement(): HTMLImageElement | null {
      return getFirstByViewTag('hangUp') as HTMLImageElement
    },
    /** Element to invite other participants into the meeting */
    getInviteOthersElement(): HTMLImageElement | null {
      return getFirstByViewTag('inviteOthers') as HTMLImageElement
    },
    /** Element that renders a list of remote participants on the bottom */
    getParticipantsListElement(): HTMLUListElement | null {
      return getFirstByViewTag('vidoeSubStream') as HTMLUListElement
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
    getWaitingMessageElements() {
      return array(findByUX('waitForOtherTag')).filter(Boolean) as HTMLElement[]
    },
    getStreams() {
      return _streams
    },
    /**
     * Wipes the entire internal state. This is mainly just used for testing
     */
    reset(key?: 'room' | 'streams') {
      if (key) {
        key === 'room' && (_room = new EventEmitter() as Room)
        key === 'streams' && (_streams = new Streams())
      } else {
        _room = new EventEmitter() as Room
        _streams = new Streams()
      }
      return this
    },
    removeFalseyParticipants(participants: any[]) {
      return participants.filter((p) => !!p?.sid)
    },
  }

  // Helpers for unit testing
  if (process.env.NODE_ENV === 'test') {
    // @ts-expect-error
    o.getInternal = () => _internal
    // @ts-expect-error
    o.setInternal = (opts: typeof _internal) =>
      void Object.assign(_internal, opts)
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
}

export default createMeetingFns
