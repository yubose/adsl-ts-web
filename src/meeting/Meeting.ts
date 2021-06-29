import * as u from '@jsmanifest/utils'
import { EventEmitter } from 'events'
import unary from 'lodash/unary'
import Logger from 'logsnap'
import { getFirstByViewTag, findByUX } from 'noodl-ui-dom'
import { isMobile, isUnitTestEnv } from '../utils/common'
import { hide, show, toast } from '../utils/dom'
import App from '../App'
import Stream from '../meeting/Stream'
import Streams from '../meeting/Streams'
import * as t from '../app/types'

const log = Logger.create('Meeting.ts')

const createMeetingFns = function _createMeetingFns(app: App) {
  let _room = new EventEmitter() as t.Room & { _isMock?: boolean }
  let _streams = new Streams()
  let _calledOnConnected = false

  async function _createRoom(token: string) {
    return Twilio.Video.connect(token, {
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

  /**
   * Start LocalParticipant tracks (intended to be used immediately after room.join)
   */
  async function _startTracks() {
    log.func('_startTracks')
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
    if (o.selfStream?.hasElement?.()) {
      log.grey(
        `Starting tracks using the existent selfStream instance`,
        o.selfStream.snapshot(),
      )
      if (!o.selfStream.hasParticipant()) {
        log.grey(
          `Missing LocalParticipant in selfStream. Setting the LocalParticipant on it now`,
          o.selfStream.snapshot(),
        )
        o.selfStream.setParticipant(_room.localParticipant)
      }
      try {
        o.selfStream.reloadTracks()
      } catch (error) {
        console.error(error)
        toast(error.message, { type: 'error' })
      }
    } else {
      log.grey(
        `Starting brand new tracks because selfStream did not have an element`,
        o.selfStream.snapshot(),
      )
      try {
        _room.localParticipant?.publishTrack(
          await Twilio.Video.createLocalAudioTrack(),
        )
      } catch (error) {
        handleTrackErr('audio', error)
      }
      try {
        _room.localParticipant?.publishTrack(
          await Twilio.Video.createLocalVideoTrack(),
        )
      } catch (error) {
        handleTrackErr('video', error)
      }
    }
  }

  const o = {
    get calledOnConnected() {
      return !!_calledOnConnected
    },
    set calledOnConnected(called: boolean) {
      _calledOnConnected = called
    },
    get isConnected() {
      return _room?.state === 'connected'
    },
    get localParticipant() {
      return _room?.localParticipant
    },
    get room() {
      return _room
    },
    set room(room) {
      _room = room
    },
    get mainStream() {
      return _streams?.mainStream
    },
    get selfStream() {
      return _streams?.selfStream
    },
    get subStreams() {
      return _streams?.subStreams
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
        if (isUnitTestEnv() && !_room._isMock) {
          throw new Error(`Meeting room should be mocked when testing`)
        }
        if (_room && _room.state !== 'connected') {
          _room = await _createRoom(token)
        } else {
          _room.state === 'disconnected' && o.leave()
          _room = await _createRoom(token)
        }
        await _startTracks()
        setTimeout(() => app.meeting.onConnected?.(_room), 2000)
        o.calledOnConnected = true
        return _room
      } catch (error) {
        console.error(error)
        toast(error.message, { type: 'error' })
        if (isUnitTestEnv()) throw error
      }
    },
    async rejoin() {
      if (isUnitTestEnv() && !_room._isMock) {
        throw new Error(`Meeting room should be mocked when testing`)
      }
      log.func('rejoin')
      log.grey(`Rejoining room`, _room)
      await _startTracks()
      setTimeout(() => app.meeting.onConnected?.(_room), 2000)
      o.calledOnConnected = true
      return _room
    },
    hideWaitingOthersMessage() {
      o.getWaitingMessageElements().forEach(unary(hide))
    },
    showWaitingOthersMessage() {
      o.getWaitingMessageElements().forEach(unary(show))
    },
    /** Disconnects from the room */
    leave() {
      log.func('leave')
      log.red(`LEAVING MEETING ROOM`)
      if (_room?.state) {
        const unpublishTracks = (
          trackPublication:
            | t.LocalVideoTrackPublication
            | t.LocalAudioTrackPublication,
        ) => {
          trackPublication?.track?.stop?.()
          trackPublication?.unpublish?.()
        }
        // Unpublish local tracks
        _room?.localParticipant?.audioTracks.forEach(unpublishTracks)
        _room?.localParticipant?.videoTracks.forEach(unpublishTracks)
        _room?.disconnect?.()
        o.streams.reset()
        _calledOnConnected = false
      }
      return this
    },
    /**
     * Adds a remote participant to the sdk and the internal state
     * @param { RemoteParticipant } participant
     * @param { object } options - This is temporarily used for debugging
     */
    addRemoteParticipant(
      participant: t.RoomParticipant,
      {
        force = false,
      }: {
        force?: boolean
      } = {},
    ) {
      if (_room?.state === 'connected') {
        if (force || !o.isLocalParticipant(participant)) {
          if (!force && o.mainStream.isParticipant(participant)) {
            // Check and remove the participant if it is still in the substreams
            if (!o.subStreams?.participantExists(participant)) {
              const subStream = o.subStreams?.findByParticipant(participant)
              // Removes the stream's video/audio tracks, video/audio elements, the main node of the stream instance, and the stream itself from the substreams collection
              if (subStream) {
                subStream.unpublish()
                subStream.removeElement()
                o.subStreams?.removeSubStream(subStream)
              }
            }
            return this
          }

          // Just set the participant as the mainStream  since it's open
          if (!o.mainStream.hasParticipant()) {
            o.mainStream.setParticipant(participant)
            app.meeting.onAddRemoteParticipant?.(
              participant as t.RemoteParticipant,
              o.mainStream,
            )
            return this
          }

          if (o.subStreams) {
            // Adds the remote participant to the substreams collection
            if (force || !o.subStreams.participantExists(participant)) {
              log.func('addRemoteParticipant')
              // Create a new DOM node
              const props = o.subStreams.blueprint
              const node = app.ndom.draw(
                // TODO - Replace this resolver call and do a cleaner
                o.subStreams.resolver?.(props) || props,
                undefined,
                app.mainPage,
              ) as any
              const subStream = o.subStreams
                .create({
                  node,
                  participant: participant as t.RemoteParticipant,
                })
                .last()
              log.green(
                `Created a new subStream and bound the newly connected participant to it`,
                { blueprint: props, node, participant, subStream },
              )
              app.meeting.onAddRemoteParticipant?.(
                participant as t.RemoteParticipant,
                subStream as Stream,
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
      } else {
        log.red(`Cannot add participant to a disconnected room`, {
          participant,
          room: _room,
        })
      }
      return this
    },
    removeRemoteParticipant(
      participant: t.RoomParticipant,
      { force }: { force?: boolean } = {},
    ) {
      if (participant && (force || !o.isLocalParticipant(participant))) {
        let subStream: Stream | null | undefined = null

        if (app.mainStream.isParticipant?.(participant)) {
          log.func('removeRemoteParticipant')
          log.orange(
            'This participant was mainstreaming. Removing it from mainStream now',
          )
          // NOTE: Be careful not to call mainStream.removeElement() here.
          // In the NOODL the mainStream is part of the page. For subStreams,
          // since we create them customly and are not included in the NOODL, we
          // would call subStream.removeElement() for those
          app.mainStream.unpublish()
          app.meeting.onRemoveRemoteParticipant?.(
            participant as t.RemoteParticipant,
            app.mainStream,
          )

          let nextMainParticipant: t.RoomParticipant | null

          if (app.subStreams) {
            subStream = app.subStreams.findBy((stream: Stream) =>
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
                subStream?.unpublish().removeElement()
                app.mainStream.setParticipant(nextMainParticipant)
                log.func('removeRemoteParticipant')
                log.green(
                  `Bound the next immediate participant to mainStream`,
                  {
                    mainStream: app.mainStream,
                    participant: nextMainParticipant,
                  },
                )
                app.subStreams?.removeSubStream(subStream)
              }
            }
          }
        } else if (app.streams?.isSubStreaming(participant)) {
          log.func('removeRemoteParticipant')
          log.orange('This remote participant was substreaming')
          subStream = app.subStreams?.findByParticipant(participant)
          if (subStream) {
            subStream.unpublish().removeElement()
            app.subStreams?.removeSubStream(subStream)
            app.meeting.onRemoveRemoteParticipant?.(
              participant as t.RemoteParticipant,
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
    isLocalParticipant(
      participant: t.RoomParticipant,
    ): participant is t.LocalParticipant {
      return !!(_room && participant === _room.localParticipant)
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
      return getFirstByViewTag('videoSubStream') as HTMLUListElement
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
        videoSubStream: o.getParticipantsListElement(),
      }
    },
    getWaitingMessageElements() {
      return u
        .array(findByUX('waitForOtherTag'))
        .filter(Boolean) as HTMLElement[]
    },
    /**
     * Wipes the entire internal state. This is mainly just used for testing
     */
    reset(key?: 'room' | 'streams') {
      if (key) {
        key === 'room' && (_room = new EventEmitter() as t.Room)
        key === 'streams' && (_streams = new Streams())
      } else {
        _room = new EventEmitter() as t.Room
        _streams = new Streams()
      }
      return this
    },
    removeFalseParticipants(participants: any[]) {
      return participants.filter((p) => !!p?.sid)
    },
  }

  return o as typeof o & {
    onConnected(room: t.Room): any
    onAddRemoteParticipant(
      participant: t.RemoteParticipant,
      stream: Stream,
    ): any
    onRemoveRemoteParticipant(
      participant: t.RemoteParticipant,
      stream: Stream,
    ): any
  }
}

export default createMeetingFns
