/* eslint-disable no-unsafe-optional-chaining */
import log from '../log'
import * as u from '@jsmanifest/utils'
import { getRandomKey } from '../utils/common'
import { toast } from '../utils/dom'
import {
  LocalTrack,
  LocalAudioTrackPublication,
  LocalVideoTrackPublication,
  RemoteTrack,
  RemoteAudioTrackPublication,
  RemoteVideoTrackPublication,
  RemoteTrackPublication,
  RoomTrack,
  RoomParticipant,
  RoomParticipantTrackPublication,
  StreamType,
  SelfUserInfo,
} from '../app/types'

class MeetingStream {
  #room: any = null
  #id = getRandomKey()
  #node: HTMLElement | null = null
  #videoElement: HTMLCanvasElement | HTMLVideoElement | null = null
  #participant: SelfUserInfo | null = null
  #userInfo: SelfUserInfo | null = null
  #isRenderSelfViewWithVideoElement: boolean = false
  previous: { userId?: string; userIdentity?: string | undefined } = {}
  type: StreamType | null = null
  events = new Map<string, ((...args: any[]) => any)[]>();

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.snapshot()
  }

  constructor(type: StreamType, { node }: { node?: HTMLElement } = {}) {
    if (node) this.#node = node
    this.type = type
    if (!type) {
      log.log({ this: this, node })
    }
  }

  get isRenderSelfViewWithVideoElement() {
    return this.#isRenderSelfViewWithVideoElement
  }

  set isRenderSelfViewWithVideoElement(value: boolean) {
    this.#isRenderSelfViewWithVideoElement = value
  }

  set room(_room) {
    this.#room = _room
  }

  #log = (name: string, s?: string, o?: Record<string, any>) => {
    s ? {} : (s = name)
    log.log(s, this.snapshot(o))
  }

  getElement() {
    return this.#node as HTMLElement
  }

  hasElement() {
    return this.#node !== null
  }

  setElement(node: HTMLElement | null) {
    const label = this.type ? `${this.type}` : `this stream`
    this.#node = node
    this.#log(
      'setElement',
      node
        ? `New element has been set on ${label}`
        : `Removed/reset the element on ${label}`,
    )
  }

  /**
   * Removes the main node of this stream (container)
   */
  removeElement() {
    if (this.#node) {
      try {
        this.#node.parentElement?.removeChild(this.#node)
        this.#node.remove()
      } catch (error) {
        log.error(error)
      }
      this.#log('removeElement', `Removed element on a "${this.type} Stream"`)
    }
  }

  /**
   * Returns true if the node is already set on this instance
   * @param { HTMLElement } node
   */
  isSameElement(node: HTMLElement) {
    return (
      !!node &&
      this.hasElement() &&
      (this.#node === node || this.#node?.id === node.id)
    )
  }

  getAudioElement() {
    return this.getElement()?.querySelector?.('audio') || null
  }

  hasAudioElement() {
    return !!this.getAudioElement()
  }

  removeAudioElement() {
    if (
      this.hasAudioElement() &&
      this.getElement()?.contains?.(this.getAudioElement())
    ) {
      this.getElement()?.removeChild(this.getAudioElement() as HTMLAudioElement)
    }
  }

  getVideoElement() {
    const node =
      this.getElement()?.querySelector?.('video') ??
      this.getElement()?.querySelector?.('canvas') ??
      null
    if (node) {
      return node
    } else {
      const element = this.getElement() as HTMLDivElement
      if (element && element.childNodes.length > 0) {
        let canvas = this.#videoElement
        if (!canvas) {
          if (this.#isRenderSelfViewWithVideoElement) {
            canvas = document.createElement('video') as HTMLVideoElement
            canvas.style.width = '100%'
            canvas.style.height = '100%'
          } else {
            canvas = document.createElement('canvas') as HTMLCanvasElement
            canvas.style.width = '100%'
            canvas.style.height = '100%'
            canvas.width = parseInt(element.style.width)
            canvas.height = parseInt(element.style.height)
          }
        }
        element.appendChild(canvas)
        return canvas
      }
    }
  }

  setVideoElement(node: HTMLCanvasElement | HTMLVideoElement | null) {
    this.#videoElement = node
  }

  getMaskElement() {
    return this.getElement()?.querySelector?.('div') ?? null
  }

  hasVideoElement() {
    return !!this.getVideoElement()
  }

  removeVideoElement() {
    if (
      this.hasVideoElement() &&
      this.getElement()?.contains?.(this.getVideoElement())
    ) {
      this.getElement()?.removeChild(this.getVideoElement() as HTMLVideoElement)
    }
  }

  getParticipant() {
    return this.#userInfo
  }

  hasParticipant() {
    return !!(
      this.#userInfo &&
      'userId' in this.#userInfo &&
      !!this.#userInfo.userId
    )
  }

  /**
   * Returns true if the node is already set on this instance
   * @param { RoomParticipant } participant
   */
  isParticipant(participant: SelfUserInfo) {
    return !!(
      this.hasParticipant() &&
      participant &&
      this.#userInfo === participant
    )
  }

  /**
   * Sets the participant's sid to do the data-sid attribute if the node is
   * available as well as bind the participant to this stream and attempts
   * to reload their tracks onto the DOM
   * @param { RoomParticipant } participant
   */
  setParticipant(participant: SelfUserInfo) {
    if (participant) {
      const node = this.getElement()
      // Bind this participant to this instance's properties
      this.previous.userId = participant.userId
      this.previous.userIdentity = participant?.userIdentity
      this.#userInfo = participant
      if (node) {
        // Attaches the data-sid attribute
        node.dataset['userId'] = participant.userId
        // Turn on their audio/video tracks and place them into the DOM
        // this.#handlePublishTracks()
      } else {
        this.#log(
          'setParticipant',
          `A participant was set on a stream but the node was not currently ` +
            `available. The publishing of the participant's tracks was skipped`,
        )
      }
    } else {
      this.#log(
        `[${this.type}] setParticipant`,
        `Tried to set participant on this stream but its the node is not available`,
        { type: this.type, participant },
      )
    }
    return this
  }

  /**
   * Removes the participant's video/audio track as well as their video/audio element they were bound to
   */
  unpublish() {
    if (this.hasParticipant()) {
      // this.#participant?.tracks?.forEach(
      //   (publication: RoomParticipantTrackPublication) => {
      //     publication.track && this.#detachTrack(publication.track)
      //   },
      // )
      this.#room.stream.stopVideo().then(() => {
        this.#room.stream.detachVideo(this.#participant?.userId)
      })
      this.#participant = null
    }
    this.removeVideoElement()
    return this
  }

  /**
   * Re-queries for the currrent participant's tracks and assigns them to the
   * currently set node if they aren't set
   */
  reloadTracks() {
    this.#log('reloadTracks', `[${this.type || 'Stream'}] Loading tracks...`, {
      args: { only },
    })

    const getErrMsg = (missingType: 'node' | 'participant') =>
      `Tried to reload one or more tracks but the ${missingType} set on this instance is ` +
      `not available`

    !this.hasElement() && this.#log(getErrMsg('node'))
    !this.hasParticipant() && this.#log(getErrMsg('participant'))

    if (
      this.#node &&
      this.#node?.dataset.userId !== this.#participant?.userId
    ) {
      this.#node.dataset.sid = this.#participant?.userId
      this.#log(`Attached participant userId in the element's dataset`)
    }

    if (!this.#participant?.tracks?.size) {
      const createTrack = async (kind: 'audio' | 'video') => {
        const fn =
          kind === 'audio'
            ? Twilio.Video.createLocalAudioTrack
            : Twilio.Video.createLocalVideoTrack
        try {
          this.#attachTrack(await fn())
        } catch (err) {
          log.error(`[${kind}]: ${err.message}`)
          toast(err.message, { type: 'error' })
        } finally {
          this.#log(`Created ${kind} track`)
        }
      }
      this.#log(`Participant is missing both tracks. Creating them now...`)
      createTrack('audio')
      createTrack('video')
    } else {
      const handleTrack = (track: LocalTrack | RemoteTrack | null) => {
        if (track) {
          const label = track.kind === 'audio' ? 'audio' : 'video'
          const counterLabel = label === 'audio' ? 'video' : 'audio'
          let elem = this.#node?.querySelector?.(label)
          this.#log('handleTrack', `Removing previous ${label} element`, {
            elem,
          })
          elem?.remove?.()
          elem = null
          if (track.kind === 'audio' && only !== counterLabel) {
            this.#node?.appendChild?.(track.attach())
            this.#log(`Started the audio element`)
          } else if (track.kind === 'video' && only !== counterLabel) {
            if (this.#node) {
              const videoElem = track.attach()
              videoElem.style.width = '100%'
              videoElem.style.height = '100%'
              videoElem.style.objectFit = 'cover'
              videoElem.style.position = 'absolute'
              this.#node.appendChild(videoElem)
              this.#log(`Started the video element`)
            }
          }
        }
      }
      this.#participant.tracks?.forEach?.(
        (publication: RoomParticipantTrackPublication) => {
          publication?.track && handleTrack(publication.track)
        },
      )
    }
  }

  /** Returns a JS representation of the current state of this stream */
  snapshot(otherArgs?: any) {
    return {
      hasElement: this.hasElement(),
      hasParticipant: this.hasParticipant(),
      hasVideoElement: this.hasVideoElement(),
      hasAudioElement: this.hasAudioElement(),
      previousParticipantSid: this.previous.userId,
      userId: this.getParticipant()?.userId || '',
      streamType: this.type,
      ...otherArgs,
    }
  }

  /**
   * Wipes out the state entirely.
   * Useful for cleanup operations and avoids memory leaks
   */
  reset({ keepStreamType = true }: { keepStreamType?: boolean } = {}) {
    if (this.#node?.childNodes) {
      for (const child of this.#node.childNodes) {
        child?.remove?.()
      }
    }
    try {
      this.#node?.parentElement?.removeChild?.(this.#node)
      this.#node?.remove?.()
      this.#node = null
      this.unpublish()
    } catch (error) {
      log.error(error)
    }
    this.#participant && (this.#participant = null)
    this.previous = {}
    !keepStreamType && (this.type = null)
    return this
  }

  // /**
  //  * close camera
  //  */
  // toggleCamera() {

  //   return
  // }

  /**
   * Handle tracks published as well as tracks that are going to be published
   * by the participant later
   */
  #handlePublishTracks = () => {
    this.#participant?.tracks?.forEach?.(this.#handleAttachTracks)
    this.#participant?.on?.('trackPublished', this.#handleAttachTracks)
    this.#participant?.on?.('trackEnabled', this.#handleTrackToggle)
    this.#participant?.on?.('trackDisabled', this.#handleTrackToggle)
  }

  #handleTrackToggle = (
    trackOrPublication: LocalTrack | RemoteTrackPublication,
  ) => {
    if ('isTrackEnabled' in trackOrPublication) {
      if (trackOrPublication.kind === 'video') {
        this.toggleBackdrop(
          trackOrPublication.isTrackEnabled ? 'open' : 'close',
        )
      }
    } else {
      const localTrack = trackOrPublication
      log.info(`localTrack`, localTrack)
    }
  }

  toggleBackdrop(type: 'close' | 'open') {
    const backdropId = `${this.#id}_backdrop`
    let backdrop = this.#node?.querySelector?.(
      `#${backdropId}`,
    ) as HTMLDivElement
    const videoNode = window.app.meeting.mainStream.getVideoElement()
    videoNode && (videoNode.style.display = type === 'close' ? 'none' : 'block')
  }

  /**
   * Attach the published track to the DOM once it is subscribed
   * @param { RoomParticipantTrackPublication } publication - Track publication
   */
  #handleAttachTracks = (publication: RoomParticipantTrackPublication) => {
    if (publication.track) this.#attachTrack(publication.track)
    else publication.on('subscribed', this.#attachTrack)
    publication.on('unsubscribed', this.#detachTrack)
  }

  /**
   * Attaches a track to a DOM node
   * @param { RoomTrack } track - Track from the room instance
   */
  #attachTrack = (track: RoomTrack) => {
    if (this.#node) {
      let attachee: HTMLAudioElement | HTMLVideoElement | undefined
      if (track.kind === 'audio') {
        attachee = track.attach()
        if (this.hasAudioElement()) {
          this.removeAudioElement()
          this.#log(`attachTrack (audio)`, `Removed previous audio element`)
        }
      } else if (track.kind === 'video') {
        attachee = track.attach()
        attachee.style.width = '100%'
        attachee.style.height = '100%'
        attachee.style.objectFit = 'cover'
        attachee.style.position = 'absolute'
        attachee.style.top = '0'
        if (this.hasVideoElement()) {
          this.removeVideoElement()
          this.#log(`attachTrack (video)`, `Removed previous video element`)
        }
      }

      const page = window.app.initPage
      if (window.app.root?.[page]) {
        let { cameraOn, micOn } = window.app.root?.[page]
        cameraOn = u.isStr(cameraOn)
          ? cameraOn === 'true'
            ? true
            : false
          : cameraOn
        micOn = u.isStr(micOn) ? (micOn === 'true' ? true : false) : micOn
        if (track.kind === 'audio') {
          micOn ? track?.['enable']?.() : track?.['disable']?.()
        } else if (track.kind === 'video') {
          cameraOn ? track?.['enable']?.() : track?.['disable']?.()
          if (attachee) {
            cameraOn || track.isEnabled
              ? (attachee.style.display = 'block')
              : (attachee.style.display = 'none')
          }
        }
      }
      if (attachee) {
        this.#node.appendChild(attachee)
        this.#log(
          `#attachTrack (${track.kind})`,
          `Loaded the participant's ${track.kind} track ${
            this.type ? `on ${this.type}` : ''
          }`,
          { track },
        )
      }
    }
  }

  /**
   * Removes the track element from the DOM
   * @param { RoomTrack } track - Track from the room instance
   */
  #detachTrack = (track: RoomTrack) => {
    if (track.kind === 'audio') {
      track?.detach?.()?.forEach((elem) => elem?.remove?.())
    } else if (track.kind === 'video') {
      track.detach?.()?.forEach((elem) => elem?.remove?.())
    }
    return this
  }
}

export default MeetingStream
