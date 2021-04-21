import { inspect } from 'util'
import {
  createLocalAudioTrack,
  createLocalVideoTrack,
  LocalTrack,
  RemoteTrack,
  LocalParticipant,
  RemoteParticipant,
} from 'twilio-video'
import { getByDataUX, NOODLDOMElement } from 'noodl-ui-dom'
import Logger from 'logsnap'
import { toast } from '../utils/dom'
import {
  RoomParticipant,
  RoomParticipantTrackPublication,
  RoomTrack,
  StreamType,
} from '../app/types'
import { attachAudioTrack, attachVideoTrack } from '../utils/twilio'

const log = Logger.create('Streams.ts')

class MeetingStream {
  #node: NOODLDOMElement | null = null
  #participant: RoomParticipant | null = null
  #uxTag: string = ''
  tempChildren: any
  previous: { sid?: string; identity?: string } = {}
  type: StreamType | null = null;

  [inspect.custom]() {
    return this.snapshot()
  }

  constructor(
    type: StreamType,
    { node, uxTag }: { node?: NOODLDOMElement; uxTag?: string } = {},
  ) {
    if (node) this.#node = node
    if (uxTag) this.#uxTag = uxTag
    this.type = type
    if (!type) console.log({ this: this, node, uxTag })
  }

  isActivelyStreaming() {
    // const vid = document.createElement('video')
  }

  hasElement() {
    return this.#node !== null && this.#node instanceof HTMLElement
  }

  getElement() {
    return this.#node as NOODLDOMElement | null
  }

  getAudioElement() {
    return this.getElement()?.querySelector?.('audio') || null
  }

  getVideoElement() {
    return this.getElement()?.querySelector?.('video') || null
  }

  /** Returns the participant that is bound to this stream */
  getParticipant() {
    return this.#participant
  }

  /**
   * Sets the node to this instance
   * @param { NOODLDOMElement | null } node
   */
  setElement(node: NOODLDOMElement | null, { uxTag }: { uxTag?: string } = {}) {
    this.#node = node
    log.func('setElement')
    log.grey('New element has been set on this stream', {
      snapshot: this.snapshot(),
    })
    if (uxTag) this.#uxTag = uxTag
    return this
  }

  /**
   * Returns true if the node is already set on this instance
   * @param { NOODLDOMElement } node
   */
  isSameElement(node: NOODLDOMElement) {
    return (
      !!node &&
      !!this.#node &&
      (this.#node === node || this.#node?.id === node.id)
    )
  }

  /** Removes the DOM node for this stream from the DOM */
  removeElement() {
    log.func('removeElement')
    if (this.#node && this.#node instanceof HTMLElement) {
      try {
        if (this.#node) {
          if (this.#node.parentNode) {
            this.#node.parentNode.removeChild(this.#node)
            log.grey(
              'Removed node from this stream by removeChild()',
              this.snapshot(),
            )
          } else {
            this.#node.remove()
            log.grey(
              'Removed node from this instance by remove()',
              this.snapshot(),
            )
          }
        }
      } catch (error) {
        console.error(error)
      }
    }
    return this
  }

  /**
   * TODO - deprecate in favor of hasParticipant
   * */
  isAnyParticipantSet() {
    return !!this.#participant
  }

  /**
   * Returns true if at least one participant has previously been bound
   * on this stream
   */
  hasParticipant() {
    return 'sid' in (this.#participant || {})
  }

  hasAudioElement() {
    return !!this.getElement()?.querySelector?.('audio')
  }

  hasVideoElement() {
    return !!this.getElement()?.querySelector?.('video')
  }

  /**
   * Updates the previous sid/identity properties and binds the new
   * participant to this stream
   */
  #replaceParticipant = (participant: RoomParticipant) => {
    this.previous.sid = participant.sid
    this.previous.identity = participant.identity
    this.#participant = participant
    return this
  }

  /**
   * Returns true if the node is already set on this instance
   * @param { NOODLDOMElement } node
   */
  isParticipant(participant: RoomParticipant) {
    return !!participant && this.#participant === participant
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
      this.#replaceParticipant(participant)
      if (node) {
        // Attaches the data-sid attribute
        node.dataset['sid'] = participant.sid
        // Turn on their audio/video tracks and place them into the DOM
        this.#handlePublishTracks()
      } else {
        log.func('setParticipant')
        log.orange(
          `A participant was set on a stream but the node was not currently ` +
            `available. The publishing of the participant's tracks was skipped`,
          this.snapshot(),
        )
      }
    } else {
      log.func(`[${this.type}] setParticipant`)
      log.red(
        `Tried to set participant on this stream but its the node is not available`,
        { type: this.type, participant },
      )
    }
    return this
  }

  /** Removes the participant's video/audio tracks from the DOM */
  unpublish(participant: RoomParticipant | null = this.#participant) {
    participant?.tracks?.forEach(
      ({ track }: RoomParticipantTrackPublication) =>
        track && this.#detachTrack(track),
    )
    return this
  }

  /**
   * Re-queries for the currrent participant's tracks and assigns them to the
   * currently set node if they aren't set
   */
  reloadTracks(only?: 'audio' | 'video') {
    log.func('reloadTracks')
    log.grey(`[${this.type || 'Stream'}] Loading tracks...`, { args: { only } })

    const getErrMsg = (missingType: 'node' | 'participant') =>
      `Tried to reload one or more tracks but the ${missingType} set on this instance is ` +
      `not available`

    !this.hasElement() && log.red(getErrMsg('node'), this.snapshot())
    !this.hasParticipant() && log.red(getErrMsg('participant'), this.snapshot())

    let node = this.getElement() as HTMLElement
    let participant = this.getParticipant() as RoomParticipant

    if (node.dataset.sid !== participant.sid) {
      node.dataset.sid = participant.sid
      log.grey(`Attached participant SID in the element's dataset`)
    }

    if (!participant.tracks?.size) {
      const createTrack = async (kind: 'audio' | 'video') => {
        const fn =
          kind === 'audio' ? createLocalAudioTrack : createLocalVideoTrack
        try {
          this.#attachTrack(await fn())
        } catch (err) {
          console.error(`[${kind}]: ${err.message}`)
          toast(err.message, { type: 'error' })
        } finally {
          log.grey(`Created ${kind} track`)
        }
      }
      log.grey(`Participant is missing both tracks. Creating them now...`)
      createTrack('audio')
      createTrack('video')
    } else {
      const handleTrack = (track: LocalTrack | RemoteTrack | null) => {
        if (track) {
          const label = track.kind === 'audio' ? 'audio' : 'video'
          const counterLabel = label === 'audio' ? 'video' : 'audio'
          let elem = this.#node?.querySelector?.(label)
          log.grey(`Removing previous ${label} element`, elem)
          elem?.remove?.()
          elem = null
          if (track.kind === 'audio' && only !== counterLabel) {
            this.#node?.appendChild?.(track.attach())
            log.grey(`Started the audio element`)
          } else if (track.kind === 'video' && only !== counterLabel) {
            if (this.#node) {
              attachVideoTrack(this.#node, track)
              log.grey(`Started the video element`)
            }
          }
        }
      }
      participant.tracks?.forEach?.(
        (publication: RoomParticipantTrackPublication) => {
          publication?.track && handleTrack(publication.track)
        },
      )
    }
  }

  /** Removes the participant from the instance */
  detachParticipant() {
    this.#participant = null
    return this
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
  reset() {
    if (this.#node?.childNodes) {
      for (const child of this.#node.childNodes) {
        child?.remove?.()
      }
    }
    try {
      this.#node?.parentElement?.removeChild?.(this.#node)
      this.#node?.remove?.()
      this.#node = null
      this.unpublish(this.#participant)
    } catch (error) {
      console.error(error)
    }
    this.#participant = null
    this.previous = {}
    this.type = null
    return this
  }

  /**
   * Handle tracks published as well as tracks that are going to be published
   * by the participant later
   * @param { LocalParticipant | RemoteParticipant } participant
   */
  #handlePublishTracks = () => {
    this.#participant?.tracks?.forEach?.(this.#handleAttachTracks)
    this.#participant?.on?.('trackPublished', this.#handleAttachTracks)
  }

  /**
   * Attach the published track to the DOM once it is subscribed
   * @param { RoomParticipantTrackPublication } publication - Track publication
   * @param { RoomParticipant } participant
   */
  #handleAttachTracks = (publication: RoomParticipantTrackPublication) => {
    // If the TrackPublication is already subscribed to, then attach the Track to the DOM.
    if (publication.track) {
      this.#attachTrack(publication.track)
    }
    const onSubscribe = (track: RoomTrack) => {
      log.func('event -- subscribed')
      log.green('"subscribed" handler is executing', this.snapshot())
      this.#attachTrack(track)
    }
    const onUnsubscribe = (track: RoomTrack) => {
      log.func('event -- unsubscribed')
      log.green('"unsubscribed" handler is executing', this.snapshot())
      this.#detachTrack(track)
    }
    publication.on('subscribed', onSubscribe)
    publication.on('unsubscribed', onUnsubscribe)
  }

  /**
   * Attaches a track to a DOM node
   * @param { RoomTrack } track - Track from the room instance
   */
  #attachTrack = (track: RoomTrack) => {
    const node = this.getElement()
    if (node) {
      if (track.kind === 'audio') {
        attachAudioTrack(node, track)
        log.func('attachTrack (audio)')
        log.green(`Loaded the participant's audio track`, {
          ...this.snapshot(),
          track,
        })
      } else if (track.kind === 'video') {
        attachVideoTrack(node, track)
        log.func('attachTrack (video)')
        log.green(`Loaded the participant's video track`, {
          ...this.snapshot(),
          track,
        })
      }
    }
    return this
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
