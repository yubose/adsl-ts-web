import * as u from '@jsmanifest/utils'
import { EventEmitter } from 'events'
import unary from 'lodash/unary'
import log from '../log'
import { findFirstByViewTag, findByUX } from 'noodl-ui'
import { isMobile, isUnitTestEnv } from '../utils/common'
import { hide, show, toast } from '../utils/dom'
import App from '../App'
import Stream from '../meeting/Stream'
import Streams from '../meeting/Streams'
import * as t from '../app/types'
import is from '../utils/is'
import ZoomVideo from '@zoom/videosdk'

const createMeetingFns = function _createMeetingFns(app: App) {
  let _room = new EventEmitter() as any & { _isMock?: boolean }
  let zoomSession
  let zoomVideo
  let _streams = new Streams()
  let _calledOnConnected = false

  async function _createRoom(token: string, topic: string, userName: string) {
    zoomVideo = ZoomVideo.createClient()
    await zoomVideo.init('en-US', 'Global', { patchJsMedia: true })
    await zoomVideo.join(topic, token, userName, '')
    const sessionInfo = zoomVideo.getSessionInfo()
    const saveZoomSessionId =
      app.root.builtIn.ecosRequest?.['saveZoomSessionId']
    if (saveZoomSessionId && sessionInfo) {
      saveZoomSessionId({
        sessionId: sessionInfo.sessionId,
        appointmentId: sessionInfo.topic,
      })
    }
    zoomSession = zoomVideo.getMediaStream()
    return zoomVideo
  }

  /**
   * Start LocalParticipant tracks (intended to be used immediately after room.join)
   */
  async function _startTracks(isload: boolean = false) {
    const page = app.initPage ? app.initPage : 'VideoChat'
    let { cameraOn, micOn } = app.root?.[page] || {}
    cameraOn = u.isStr(cameraOn)
      ? cameraOn === 'true'
        ? true
        : false
      : cameraOn
    micOn = u.isStr(micOn) ? (micOn === 'true' ? true : false) : micOn
    o.selfStream.isRenderSelfViewWithVideoElement =
      zoomSession.isRenderSelfViewWithVideoElement()
    o.selfStream.room = zoomVideo
    o.mainStream.room = zoomVideo
    o.selfStream.setParticipant(zoomVideo.getCurrentUserInfo())
    if (o.selfStream?.hasElement?.()) {
      log.debug(
        `Starting tracks using the existent selfStream instance`,
        o.selfStream.snapshot(),
      )
      if (!o.selfStream.hasParticipant()) {
        log.debug(
          `Missing LocalParticipant in selfStream. Setting the LocalParticipant on it now`,
          o.selfStream.snapshot(),
        )
      }
      try {
        if (is.isBoolean(cameraOn)) {
          if (is.isBooleanTrue(cameraOn)) {
            await app.selfStream.toggeleSelfCamera('open', isload)
          }
        }

        if (is.isBoolean(micOn)) {
          if (is.isBooleanTrue(micOn)) {
            await app.selfStream.toggleSelfMicrophone('open')
          }
        }

        const selfUser = zoomVideo?.getCurrentUserInfo()

        const mainStreamEl = app.mainStream.getElement()
        const mask = app.mainStream.getMaskElement()
        const users = zoomVideo?.getAllUser()
        for (const user of users) {
          if (user.userId !== selfUser.userId && user.bVideoOn) {
            const canvas = app.mainStream.getVideoElement()
            app.mainStream.setParticipant(zoomVideo.getUser(user.userId))
            // await zoomSession.startVideo({ videoElement: canvas })
            if (canvas?.id?.indexOf('ZOOM') === -1) {
              await zoomSession.renderVideo(
                canvas,
                user.userId,
                parseInt(mainStreamEl.style.width),
                parseInt(mainStreamEl.style.height),
                0,
                0,
                3,
              )
            }
            mask && (mask.style.display = 'none')
          }
        }
      } catch (error) {
        log.debug('_startTracks', error)
      }
    } else {
      log.debug(
        `Starting brand new tracks because selfStream did not have an element`,
        o.selfStream.snapshot(),
      )
      try {
        if (is.isBoolean(cameraOn)) {
          if (is.isBooleanTrue(cameraOn)) {
            await app.selfStream.toggeleSelfCamera('open', isload)
          }
        }

        if (is.isBoolean(micOn)) {
          if (is.isBooleanTrue(micOn)) {
            zoomSession.startAudio()
          }
        }
      } catch (error) {
        log.debug(error)
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
      return !!this.currentSession?.isInMeeting
    },
    get localParticipant() {
      return _room?.getCurrentUserInfo()
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
    get currentSession() {
      return zoomVideo?.getSessionInfo ? zoomVideo.getSessionInfo?.() : {}
    },
    get isInMeeting() {
      return !!this.currentSession?.isInMeeting
    },
    /**
     * Joins and returns the room using the token
     * @param { string } token - Room token
     */
    async join(token: string, topic: string, userName: string) {
      try {
        if (isUnitTestEnv() && !_room._isMock) {
          throw new Error(`Meeting room should be mocked when testing`)
        }
        if (_room && !o.isInMeeting) {
          _room = await _createRoom(token, topic, userName)
        } else {
          o.isInMeeting && o.leave()
          _room = await _createRoom(token, topic, userName)
        }
        log.debug(`joining room`, _room)
        setTimeout(async () => {
          await app.meeting.onConnected?.(_room)
          await _startTracks()
          o.calledOnConnected = true
        }, 1000)
        // await app.meeting.onConnected?.(_room)
        // setTimeout(() => app.meeting.onConnected?.(_room), 2000)
        // o.calledOnConnected = true
        // await _startTracks()
        return _room
      } catch (error) {
        log.error(error)
        toast(
          //@ts-expect-error
          (error instanceof Error ? error : new Error(String(error['reason'])))
            .message,
          { type: 'error' },
        )
        if (isUnitTestEnv()) throw error
      }
    },
    async rejoin() {
      log.debug(`Rejoining room`, zoomVideo)
      // await _startTracks()
      setTimeout(async () => {
        // await app.meeting.onConnected?.(zoomVideo)
        await _startTracks(true)
        o.calledOnConnected = true
      }, 1000)
      // await app.meeting.onConnected?.(_room)
      // o.calledOnConnected = true
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
      log.error(`LEAVING MEETING ROOM`, this.isInMeeting)
      if (this.isInMeeting) {
        zoomVideo.off('user-updated', () => {})
        zoomVideo.off('user-removed', () => {})
        zoomVideo.off('user-add', () => {})
        zoomVideo.off('connection-change', () => {})
        zoomVideo.off('peer-video-state-change', () => {})
        zoomVideo.off('media-sdk-change', () => {})
        o.calledOnConnected = false
        o.reset()
        zoomVideo.leave()
      }
      return this
    },
    /**
     * Adds a remote participant to the sdk and the internal state
     * @param { RemoteParticipant } participant
     * @param { object } options - This is temporarily used for debugging
     */
    async addRemoteParticipant(
      participant: t.SelfUserInfo,
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
            await app.meeting.onAddRemoteParticipant?.(
              participant as t.SelfUserInfo,
              o.mainStream,
            )
            return this
          }

          if (o.subStreams) {
            // Adds the remote participant to the substreams collection
            if (force || !o.subStreams.participantExists(participant)) {
              // Create a new DOM node
              const props = o.subStreams.blueprint
              const node = (await app.ndom.draw(
                // TODO - Replace this resolver call and do a cleaner
                (await o.subStreams.resolver?.(props)) || props,
                undefined,
                app.mainPage,
              )) as any
              const subStream = o.subStreams
                .create({
                  node,
                  participant: participant as t.SelfUserInfo,
                })
                .last()
              log.info(
                `Created a new subStream and bound the newly connected participant to it`,
                { blueprint: props, node, participant, subStream },
              )
              app.meeting.onAddRemoteParticipant?.(
                participant as t.SelfUserInfo,
                subStream as Stream,
              )
            } else {
              log.warn(
                `Did not proceed to add this remotes participant to a ` +
                  `subStream because they are already in one`,
              )
            }
          } else {
            // NOTE: We cannot create a container here because the container is
            // only created while rendering/parsing the NOODL components. It should
            // stay that way to reduce complexity
            log.error(
              `Cannot add participant without the subStreams container, ` +
                `which doesn't exist. This participant will not be shown on ` +
                `the page`,
              { participant, streams: _streams },
            )
          }
        }
      } else {
        log.error(`Cannot add participant to a disconnected room`, {
          participant,
          room: _room,
        })
      }
      return this
    },
    removeRemoteParticipant(
      participant: t.SelfUserInfo,
      { force }: { force?: boolean } = {},
    ) {
      if (participant && (force || !o.isLocalParticipant(participant))) {
        let subStream: Stream | null | undefined = null

        if (app.mainStream.isParticipant?.(participant)) {
          log.warn(
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
                log.info(`Bound the next immediate participant to mainStream`, {
                  mainStream: app.mainStream,
                  participant: nextMainParticipant,
                })
                app.subStreams?.removeSubStream(subStream)
              }
            }
          }
        } else if (app.streams?.isSubStreaming(participant)) {
          log.warn('This remote participant was substreaming')
          subStream = app.subStreams?.findByParticipant(participant)
          if (subStream) {
            subStream.unpublish().removeElement()
            app.subStreams?.removeSubStream(subStream)
            app.meeting.onRemoveRemoteParticipant?.(
              participant as t.SelfUserInfo,
              subStream,
            )
          }
        }
      }
      return this
    },
    cloudRecord(type: 'exclude' | 'include') {
      const cloudRecording = zoomVideo.getRecordingClient()
      switch (type) {
        case 'include':
          cloudRecording.startCloudRecording()
          return true
        case 'exclude':
          cloudRecording.stopCloudRecording()
          return false
      }
    },
    async switchCamera() {
      const cameraList = zoomSession.getCameraList()
      const currentCameraId = zoomSession.getActiveCamera()
      if (u.isArr(cameraList) && cameraList.length >= 2) {
        for (const camera of cameraList) {
          if (camera.deviceId !== currentCameraId) {
            await zoomSession.switchCamera(camera.deviceId)
          }
        }
      }
    },
    /**
     * Returns true if the participant is the LocalParticipant
     * @param { RoomParticipant } participant
     */
    isLocalParticipant(
      participant: t.SelfUserInfo,
    ): participant is t.SelfUserInfo {
      return !!(_room && participant === _room.localParticipant)
    },
    /** Element used for the dominant/main speaker */
    getMainStreamElement(): HTMLDivElement | null {
      return findFirstByViewTag('mainStream') as HTMLDivElement
    },
    /** Element that the local participant uses (self mirror) */
    getSelfStreamElement(): HTMLDivElement | null {
      return findFirstByViewTag('selfStream') as HTMLDivElement
    },
    /** Element that renders a remote participant into the participants list */
    getSubStreamElement(): HTMLDivElement | HTMLDivElement[] | null {
      return findFirstByViewTag('subStream') as HTMLDivElement
    },
    /** Element that toggles the camera on/off */
    getCameraElement(): HTMLImageElement | null {
      return findFirstByViewTag('camera') as HTMLImageElement
    },
    /** Element that toggles the microphone on/off */
    getMicrophoneElement(): HTMLImageElement | null {
      return findFirstByViewTag('microphone') as HTMLImageElement
    },
    /** Element that completes the meeting when clicked */
    getHangUpElement(): HTMLImageElement | null {
      return findFirstByViewTag('hangUp') as HTMLImageElement
    },
    /** Element to invite other participants into the meeting */
    getInviteOthersElement(): HTMLImageElement | null {
      return findFirstByViewTag('inviteOthers') as HTMLImageElement
    },
    /** Element that renders a list of remote participants on the bottom */
    getParticipantsListElement(): HTMLUListElement | null {
      return findFirstByViewTag('videoSubStream') as HTMLUListElement
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
        key === 'room' && (_room = new EventEmitter())
        key === 'streams' && (_streams = new Streams())
      } else {
        _room = null
        _streams = new Streams()
      }
      return this
    },
    removeFalseParticipants(participants: any[]) {
      return participants.filter((p) => !!p?.userId)
    },
    /**
     * Switches a participant's stream to another participant's stream
     * @param { Stream } stream1
     * @param { Stream } stream2
     * @param { t.RoomParticipant } participant1
     * @param { t.RoomParticipant } participant2
     */
    // swapParticipantStream(
    //   stream1: Stream, // participant1 should currently be inside stream1
    //   stream2: Stream, // participant2 should currently be inside stream2
    //   participant1: t.RoomParticipant,
    //   participant2: t.RoomParticipant,
    // ) {
    //   if (stream1 && stream2 && stream1.isParticipant(participant1)) {
    //     if (stream1.getParticipant() !== participant2) {
    //       stream1.unpublish()
    //       stream2.unpublish()
    //       stream1.setParticipant(participant2)
    //       stream2.setParticipant(participant1)
    //     }
    //   }
    // },
  }

  return o as typeof o & {
    onConnected(room: any): any
    onAddRemoteParticipant(participant: t.SelfUserInfo, stream: Stream): any
    onRemoveRemoteParticipant(participant: t.SelfUserInfo, stream: Stream): any
  }
}

export default createMeetingFns
