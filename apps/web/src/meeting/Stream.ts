import log from '../log'
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
} from '../app/types'
import { resolveAssetUrl } from 'noodl-ui'

class MeetingStream {
  #id = getRandomKey()
  #node: HTMLElement | null = null
  #participant: RoomParticipant | null = null
  previous: { sid?: string; identity?: string } = {}
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

  get tracks() {
    return (
      this.hasParticipant()
        ? Array.from(this.getParticipant()?.tracks.values() as any).filter(
            Boolean,
          )
        : []
    ) as RoomParticipantTrackPublication[]
  }

  get audioTrackPublication() {
    return (
      (this.tracks.find((publication) => publication.kind === 'audio') as
        | LocalAudioTrackPublication
        | RemoteAudioTrackPublication) || null
    )
  }

  get videoTrackPublication() {
    return (
      (this.tracks.find((publication) => publication.kind === 'video') as
        | LocalVideoTrackPublication
        | RemoteVideoTrackPublication) || null
    )
  }

  get audioTrack() {
    return this.audioTrackPublication?.track || null
  }

  get videoTrack() {
    return this.videoTrackPublication?.track || null
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
    return this.getElement()?.querySelector?.('video') || null
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
    return this.#participant
  }

  hasParticipant() {
    return !!(
      this.#participant &&
      'sid' in this.#participant &&
      !!this.#participant.sid
    )
  }

  /**
   * Returns true if the node is already set on this instance
   * @param { RoomParticipant } participant
   */
  isParticipant(participant: RoomParticipant) {
    return !!(
      this.hasParticipant() &&
      participant &&
      this.#participant === participant
    )
  }

  /**
   * Sets the participant's sid to do the data-sid attribute if the node is
   * available as well as bind the participant to this stream and attempts
   * to reload their tracks onto the DOM
   * @param { RoomParticipant } participant
   */
  setParticipant(participant: RoomParticipant) {
    if (participant) {
      const node = this.getElement()
      // Bind this participant to this instance's properties
      this.previous.sid = participant.sid
      this.previous.identity = participant.identity
      this.#participant = participant
      if (node) {
        // Attaches the data-sid attribute
        node.dataset['sid'] = participant.sid
        // Turn on their audio/video tracks and place them into the DOM
        this.#handlePublishTracks()
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
      this.#participant?.tracks?.forEach(
        (publication: RoomParticipantTrackPublication) => {
          publication.track && this.#detachTrack(publication.track)
        },
      )
      this.#participant = null
    }
    this.removeAudioElement()
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

    if (this.#node && this.#node?.dataset.sid !== this.#participant?.sid) {
      this.#node.dataset.sid = this.#participant?.sid
      this.#log(`Attached participant SID in the element's dataset`)
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
      previousParticipantSid: this.previous.sid,
      sid: this.getParticipant()?.sid || '',
      streamType: this.type,
      tracks: this.getParticipant()?.tracks,
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

  toggleBackdrop(type: 'open' | 'close') {
    const backdropId = `${this.#id}_backdrop`
    let backdrop = this.#node?.querySelector?.(
      `#${backdropId}`,
    ) as HTMLDivElement
    const videoNode = (window as any).app.meeting.mainStream.getVideoElement()
    videoNode.style.display = type === 'close'?'none':'block'
    // if (!backdrop) {
    //   backdrop = document.createElement('div')
    //   backdrop.id = backdropId
    //   backdrop.style.width = '100%'
    //   backdrop.style.height = '100%'
    //   backdrop.style.position = 'absolute'
    //   backdrop.style.top = '0px'
    //   backdrop.style.right = '0px'
    //   backdrop.style.bottom = '0px'
    //   backdrop.style.left = '0px'
    //   backdrop.style.background = '#000'
    //   const img = document.createElement('img')
    //   img.style.width = '50%'
    //   img.style.height = 'auto'
    //   img.style.position = 'absolute'
    //   img.style.top = '25%'
    //   img.style.left = '25%'
    //   let srcPath = resolveAssetUrl(
    //     'default.svg',
    //     window.app.nui.getAssetsUrl(),
    //   )
    //   img.setAttribute('src', srcPath)
    //   backdrop.appendChild(img)
    //   this.#node?.appendChild?.(backdrop)
    // }

    // backdrop.style.visibility = type === 'close' ? 'visible' : 'hidden'
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


      if((window as any).app.root.VideoChat){
        const {cameraOn,micOn} = (window as any).app.root.VideoChat
        if(track.kind === 'audio'){
          micOn ? track?.['enable']?.() : track?.['disable']?.()
        }else if(track.kind === 'video'){
          cameraOn ? track?.['enable']?.() : track?.['disable']?.()
          if(attachee){
            cameraOn? attachee.style.display = 'block':attachee.style.display = 'none'
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
