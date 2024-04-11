/* eslint-disable no-unsafe-optional-chaining */
import log from '../log'
import * as u from '@jsmanifest/utils'
import { getRandomKey } from '../utils/common'
import { toast } from '../utils/dom'
import {
  StreamType,
  SelfUserInfo,
  videoActiveChange,
  MeetingPages,
} from '../app/types'
import { findByUX } from 'noodl-ui'
class MeetingStream {
  #room: any = null
  #zoomStream: any = null
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
    this.#zoomStream = _room.stream
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

  setVideoElement(
    node: HTMLCanvasElement | HTMLVideoElement | null | undefined,
  ) {
    if (node) {
      this.#videoElement = node
      const maskEl = this.getMaskElement()
      this.toggleBackdrop('open', node, maskEl)
    }
  }

  getMaskElement() {
    return this.getElement()?.querySelector?.('div')
  }

  hasVideoElement() {
    const node =
      this.getElement()?.querySelector?.('video') ??
      this.getElement()?.querySelector?.('canvas') ??
      null
    return !!node
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
  reloadTracks(only?: 'audio' | 'video') {
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

    if (!this.#participant?.bVideoOn) {
      this.#log(`Participant is missing both tracks. Creating them now...`)
      this.#zoomStream.startVideo().then(() => {
        this.#zoomStream
          .attachVideo(this.#participant?.userId, 4)
          .then((userVideo) => {
            this.#node?.appendChild(userVideo)
          })
      })
    }
    // else {
    //   const handleTrack = (track: LocalTrack | RemoteTrack | null) => {
    //     if (track) {
    //       const label = track.kind === 'audio' ? 'audio' : 'video'
    //       const counterLabel = label === 'audio' ? 'video' : 'audio'
    //       let elem = this.#node?.querySelector?.(label)
    //       this.#log('handleTrack', `Removing previous ${label} element`, {
    //         elem,
    //       })
    //       elem?.remove?.()
    //       elem = null
    //       if (track.kind === 'audio' && only !== counterLabel) {
    //         this.#node?.appendChild?.(track.attach())
    //         this.#log(`Started the audio element`)
    //       } else if (track.kind === 'video' && only !== counterLabel) {
    //         if (this.#node) {
    //           const videoElem = track.attach()
    //           videoElem.style.width = '100%'
    //           videoElem.style.height = '100%'
    //           videoElem.style.objectFit = 'cover'
    //           videoElem.style.position = 'absolute'
    //           this.#node.appendChild(videoElem)
    //           this.#log(`Started the video element`)
    //         }
    //       }
    //     }
    //   }
    //   this.#participant.tracks?.forEach?.(
    //     (publication: RoomParticipantTrackPublication) => {
    //       publication?.track && handleTrack(publication.track)
    //     },
    //   )
    // }
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
      // this.unpublish()
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
  // #handlePublishTracks = () => {
  //   this.#participant?.tracks?.forEach?.(this.#handleAttachTracks)
  //   this.#participant?.on?.('trackPublished', this.#handleAttachTracks)
  //   this.#participant?.on?.('trackEnabled', this.#handleTrackToggle)
  //   this.#participant?.on?.('trackDisabled', this.#handleTrackToggle)
  // }

  // #handleTrackToggle = (userId: number) => {
  //   if (this.type === 'selfStream') {
  //     if (this.#isRenderSelfViewWithVideoElement){
  //       await zoomSession.startVideo({
  //         fullHd: true,
  //         hd: true,
  //         ptz: true,
  //         videoElement: canvas,
  //         originalRatio: true,
  //         captureWidth: 360,
  //         captureHeight: 1080,
  //       })
  //     }
  //   }
  //   const userInfo = this.#room.getUser(userId)
  //   this.setParticipant(userInfo)
  //   const bVideoOn = userInfo?.bVideoOn
  //   this.toggleBackdrop(bVideoOn ? 'close' : 'open')
  // }

  async toggleRemoteCamera(videoStatus: videoActiveChange) {
    try {
      const zoomSession = this.#room.stream
      const page = window.app.initPage
      if (this.#node) {
        let containerEl = this.#node
        let maskEl = this.getMaskElement()
        let canvasEl = this.getVideoElement()
        this.setParticipant(this.#room.getUser(videoStatus.userId))
        if (!MeetingPages.includes(page)) {
          containerEl = findByUX('minimizeVideoChat') as HTMLElement
          if (containerEl) {
            maskEl = containerEl.querySelector('div')
            canvasEl =
              containerEl.querySelector('canvas') ??
              containerEl.querySelector('video') ??
              undefined
            const node = this.getVideoElement()
            if (node) {
              canvasEl = node
              containerEl.appendChild(canvasEl)
            }
            if (!canvasEl) {
              if (this.#isRenderSelfViewWithVideoElement) {
                canvasEl = document.createElement('video') as HTMLVideoElement
                canvasEl.style.width = '100%'
                canvasEl.style.height = '100%'
              } else {
                canvasEl = document.createElement('canvas') as HTMLCanvasElement
                canvasEl.style.width = '100%'
                canvasEl.style.height = '100%'
                canvasEl.width = parseInt(containerEl.style.width)
                canvasEl.height = parseInt(containerEl.style.height)
              }
              containerEl.appendChild(canvasEl)
            }
          }
        }
        console.log('test99', videoStatus)
        if (videoStatus.state === 'Active') {
          await zoomSession.renderVideo(
            canvasEl,
            videoStatus.userId,
            parseInt(this.#node.style.width),
            parseInt(this.#node.style.height),
            0,
            0,
            3,
          )
        } else if (videoStatus.state === 'Inactive') {
          await zoomSession.stopRenderVideo(canvasEl, videoStatus.userId)
        }

        if (canvasEl && maskEl)
          this.toggleBackdrop(
            videoStatus.state === 'Active' ? 'open' : 'close',
            canvasEl,
            maskEl,
          )
      }
    } catch (error) {
      log.debug(error)
      //@ts-expect-error
      toast(error?.reason, { type: 'default' })
    }
  }

  async toggeleSelfCamera(type: 'close' | 'open', reload: boolean = false) {
    try {
      const selfStreamEl = this.getElement()
      const canvas = this.getVideoElement()
      const maskEl = this.getMaskElement()
      if (type === 'open') {
        if (!reload) {
          if (this.#isRenderSelfViewWithVideoElement) {
            await this.#zoomStream.startVideo({
              fullHd: true,
              hd: true,
              ptz: true,
              videoElement: canvas,
              originalRatio: true,
              // captureWidth: 360,
              // captureHeight: 1080,
            })
            // self video started and rendered
          } else {
            await this.#zoomStream.startVideo({
              fullHd: true,
              hd: true,
              ptz: true,
              originalRatio: true,
              // captureWidth: 360,
              // captureHeight: 640,
            })
          }
        }
        await this.#zoomStream.renderVideo(
          canvas,
          this.#userInfo?.userId,
          parseInt(selfStreamEl.style.width),
          parseInt(selfStreamEl.style.height),
          0,
          0,
          3,
        )
        this.toggleBackdrop(type, canvas, maskEl)
      } else if (type === 'close') {
        await this.#zoomStream.stopVideo()
        this.toggleBackdrop(type, canvas, maskEl)
      }
    } catch (error) {
      log.debug(error)
      //@ts-expect-error
      toast(error?.reason, { type: 'default' })
    }
  }

  async toggleSelfMicrophone(type: 'close' | 'open') {
    try {
      if (type === 'open') {
        await this.#zoomStream.startAudio().then(async () => {
          await this.#zoomStream.unmuteAudio()
        })
      } else if (type === 'close') {
        await this.#zoomStream.muteAudio()
      }
    } catch (error) {
      log.debug(error)
      //@ts-expect-error
      toast(error?.reason, { type: 'default' })
    }
  }

  toggleBackdrop(
    type: 'close' | 'open',
    videoEl?: HTMLCanvasElement | HTMLVideoElement | undefined,
    maskEl?: HTMLDivElement | null,
  ) {
    let _videoEl = videoEl
    let _maskEl = maskEl
    if (!_videoEl) _videoEl = this.getVideoElement()
    if (!_maskEl) _maskEl = this.getMaskElement()
    if (_videoEl && _maskEl) {
      switch (type) {
        case 'close':
          _videoEl.style.display = 'none'
          _maskEl.style.display = 'flex'
          break
        case 'open':
          _videoEl.style.display = 'block'
          _maskEl.style.display = 'none'
          break
      }
    }
  }

  /**
   * Attach the published track to the DOM once it is subscribed
   * @param { RoomParticipantTrackPublication } publication - Track publication
   */
  // #handleAttachTracks = (publication: RoomParticipantTrackPublication) => {
  //   if (publication.track) this.#attachTrack(publication.track)
  //   else publication.on('subscribed', this.#attachTrack)
  //   publication.on('unsubscribed', this.#detachTrack)
  // }

  /**
   * Attaches a track to a DOM node
   * @param { RoomTrack } track - Track from the room instance
   */
  // #attachTrack = (track: RoomTrack) => {
  //   if (this.#node) {
  //     let attachee: HTMLAudioElement | HTMLVideoElement | undefined
  //     if (track.kind === 'audio') {
  //       attachee = track.attach()
  //       if (this.hasAudioElement()) {
  //         this.removeAudioElement()
  //         this.#log(`attachTrack (audio)`, `Removed previous audio element`)
  //       }
  //     } else if (track.kind === 'video') {
  //       attachee = track.attach()
  //       attachee.style.width = '100%'
  //       attachee.style.height = '100%'
  //       attachee.style.objectFit = 'cover'
  //       attachee.style.position = 'absolute'
  //       attachee.style.top = '0'
  //       if (this.hasVideoElement()) {
  //         this.removeVideoElement()
  //         this.#log(`attachTrack (video)`, `Removed previous video element`)
  //       }
  //     }

  //     const page = window.app.initPage
  //     if (window.app.root?.[page]) {
  //       let { cameraOn, micOn } = window.app.root?.[page]
  //       cameraOn = u.isStr(cameraOn)
  //         ? cameraOn === 'true'
  //           ? true
  //           : false
  //         : cameraOn
  //       micOn = u.isStr(micOn) ? (micOn === 'true' ? true : false) : micOn
  //       if (track.kind === 'audio') {
  //         micOn ? track?.['enable']?.() : track?.['disable']?.()
  //       } else if (track.kind === 'video') {
  //         cameraOn ? track?.['enable']?.() : track?.['disable']?.()
  //         if (attachee) {
  //           cameraOn || track.isEnabled
  //             ? (attachee.style.display = 'block')
  //             : (attachee.style.display = 'none')
  //         }
  //       }
  //     }
  //     if (attachee) {
  //       this.#node.appendChild(attachee)
  //       this.#log(
  //         `#attachTrack (${track.kind})`,
  //         `Loaded the participant's ${track.kind} track ${
  //           this.type ? `on ${this.type}` : ''
  //         }`,
  //         { track },
  //       )
  //     }
  //   }
  // }

  /**
   * Removes the track element from the DOM
   * @param { RoomTrack } track - Track from the room instance
   */
  // #detachTrack = (track: RoomTrack) => {
  //   if (track.kind === 'audio') {
  //     track?.detach?.()?.forEach((elem) => elem?.remove?.())
  //   } else if (track.kind === 'video') {
  //     track.detach?.()?.forEach((elem) => elem?.remove?.())
  //   }
  //   return this
  // }
}

export default MeetingStream
