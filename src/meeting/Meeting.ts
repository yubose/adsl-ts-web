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

interface Internal {
  _room: Room
  _streams: Streams
}

// import makePublications from './makePublications'
// import makeTrack from './makeTrack'

const createMeetingFns = function _createMeetingFns(app: App) {
  const _internal: Internal = {
    _room: new EventEmitter() as Room,
    _streams: new Streams(),
  } as Internal

  const o = {
    /**
     * Joins and returns the room using the token
     * @param { string } token - Room token
     * @param { ConnectOptions? } options - Options passed to the connect call
     */
    async join(token: string, options?: ConnectOptions) {
      try {
        // TODO - timeout
        const room = await connect(token, {
          dominantSpeaker: true,
          logLevel: 'info',
          ...options,
          tracks: [],
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

        function handleTrackErr(kind: 'audio' | 'video', err: Error) {
          console.error(err)
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

          toast(errMsg, { type: 'error' })
        }

        let localAudioTrack: LocalAudioTrack
        let localVideoTrack: LocalVideoTrack

        try {
          localAudioTrack = await createLocalAudioTrack()
          room.localParticipant.publishTrack(localAudioTrack)
        } catch (error) {
          handleTrackErr('audio', error)
        }
        try {
          localVideoTrack = await createLocalVideoTrack()
          room.localParticipant.publishTrack(localVideoTrack)
        } catch (error) {
          handleTrackErr('video', error)
        }

        setTimeout(() => app.meeting.onConnected?.(room), 2000)
        _internal._room = room
        console.log('"HELLOOO')
        return _internal._room
      } catch (error) {
        console.error(error)
        toast(error.message, { type: 'error' })
      }
    },
    hideWaitingOthersMessage() {
      array(app.meeting.getWaitingMessageElement()).forEach((node) =>
        hide(node),
      )
    },
    showWaitingOthersMessage() {
      array(app.meeting.getWaitingMessageElement()).forEach((node) =>
        show(node),
      )
    },
    /** Disconnects from the room */
    leave() {
      log.func('leave')
      log.red(`LEAVING MEETING ROOM`, new Error('test').stack)
      if (_internal._room?.state) {
        const unpublishTracks = (
          trackPublication:
            | LocalVideoTrackPublication
            | LocalAudioTrackPublication,
        ) => {
          trackPublication?.track?.stop?.()
          trackPublication?.unpublish?.()
        }
        // Unpublish local tracks
        _internal._room?.localParticipant?.audioTracks.forEach(unpublishTracks)
        _internal._room?.localParticipant?.videoTracks.forEach(unpublishTracks)
        _internal._room?.disconnect?.()
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
        force?: 'mainStream' | 'selfStream' | 'subStream' | ''
      } = {},
    ) {
      if (_internal._room?.state === 'connected') {
        if (force || !o.isParticipantLocal(participant)) {
          const mainStream = _internal._streams?.getMainStream()
          const subStreams = _internal._streams?.getSubStreamsContainer()
          // Safe checking -- remove the participant from a subStream if they
          // are in an existing one for some reason
          if (!force && mainStream.isSameParticipant(participant)) {
            if (!subStreams?.participantExists(participant)) {
              let subStream = subStreams?.findBy((s: Stream) =>
                s.isSameParticipant(participant),
              )
              if (subStream) {
                subStream.unpublish()
                subStream.removeElement()
                subStreams?.removeSubStream(subStream)
              }
            }
            return this
          }
          // Just set the participant as the mainStream  since it's open
          if (!mainStream.isAnyParticipantSet()) {
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
    removeRemoteParticipant(
      participant: T.RoomParticipant,
      { force }: { force?: boolean } = {},
    ) {
      if (participant && (force || !o.isParticipantLocal(participant))) {
        let mainStream: Stream | null = _internal._streams.getMainStream()
        let subStreams: MeetingSubstreams | null = _internal._streams?.getSubStreamsContainer()
        let subStream: Stream | null | undefined = null

        if (_internal._streams?.isMainStreaming?.(participant)) {
          log.func('removeRemoteParticipant')
          log.orange(
            'This participant was mainstreaming. Removing it from mainStream now',
          )
          mainStream = _internal._streams.getMainStream()
          // NOTE: Be careful not to call mainStream.removeElement() here.
          // In the NOODL the mainStream is part of the page. For subStreams,
          // since we create them customly and are not included in the NOODL, we
          // would call subStream.removeElement() for those
          mainStream.unpublish().detachParticipant()
          app.meeting.onRemoveRemoteParticipant?.(
            participant as RemoteParticipant,
            mainStream,
          )

          let nextMainParticipant: T.RoomParticipant | null

          if (subStreams) {
            subStream = subStreams.findBy((stream: Stream) =>
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
                subStream.unpublish().detachParticipant().removeElement()
                mainStream.setParticipant(nextMainParticipant)
                log.func('removeRemoteParticipant')
                log.green(
                  `Bound the next immediate participant to mainStream`,
                  { mainStream, participant: nextMainParticipant },
                )
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
                  `will remain blank`,
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
          subStream = subStreams?.findBy((stream: Stream) =>
            stream.isSameParticipant(participant),
          )
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
      return participant === _internal._room?.localParticipant
    },
    resetRoom() {
      _internal._room = new EventEmitter() as Room
      return this
    },
    get room() {
      return _internal._room
    },
    get localParticipant() {
      return _internal._room?.localParticipant
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
    getWaitingMessageElement() {
      const elems = array(findByUX('waitForOtherTag') as HTMLDivElement)
      return elems.length > 1 ? elems : elems[0] || null
    },
    getStreams() {
      return _internal._streams
    },
    /**
     * Wipes the entire internal state. This is mainly just used for testing
     */
    reset() {
      Object.assign(_internal, {
        _room: new EventEmitter() as Room,
        _streams: new Streams(),
      })
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
