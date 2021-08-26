import * as u from '@jsmanifest/utils'
import Logger from 'logsnap'
import inRange from 'lodash/inRange'
import last from 'lodash/last'
import { ComponentObject } from 'noodl-types'
import { NUI } from 'noodl-ui'
import { NDOMElement } from 'noodl-ui-dom'
import Stream from './Stream'
import * as t from '../app/types'

const log = Logger.create('Substreams.ts')

/** The container for subStreams */
class MeetingSubstreams {
  #subStreams: Stream[] = []
  blueprint: ComponentObject
  container: NDOMElement | null
  resolver: typeof NUI.resolveComponents = async (c: any) => c;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.snapshot()
  }

  constructor(
    container: NDOMElement,
    opts?: {
      blueprint?: ComponentObject
      resolver?: typeof NUI.resolveComponents
    },
  ) {
    this.container = container
    this.blueprint = (opts?.blueprint || {}) as ComponentObject
    this.resolver = opts?.resolver as typeof NUI.resolveComponents
  }

  get length() {
    return this.#subStreams.length
  }

  /**
   * Adds a new stream instance to the subStreams collection. If a node was passed in
   * it will be inserted into the DOM. If a participant was passed in their media tracks will attempt to start automatically
   * @param { HTMLElement | undefined } node
   * @param { RemoteParticipant | undefined } participant
   */
  create({
    node,
    participant,
  }: { node?: HTMLElement; participant?: t.RemoteParticipant } = {}) {
    log.func('create')

    const stream = new Stream('subStream', { node })

    if (node && this.container && !this.container.contains(node)) {
      this.container?.appendChild(node)
      log.grey(`Appended new child DOM element to substreams's node`)
    }
    // Apply the blueprint onto the new node to align with the current items
    if (participant) {
      stream.setParticipant(participant)
      log.grey(
        `The participant "${participant.sid}" was set on the stream`,
        stream.snapshot(),
      )
    }
    this.addToCollection(stream)
    return this
  }

  /**
   * Inserts/pushes a stream into the subStreams collection
   * If an index is passed in, it will insert the stream at the index position
   * @param { Stream } stream
   * @param { number | undefined } index
   */
  addToCollection(stream: Stream, index?: number) {
    log.func('addToCollection')
    if (!this.#subStreams.includes(stream)) {
      if (typeof index === 'number') {
        this.#subStreams.splice(index, 0, stream)
        log.grey(
          `Inserted subStream to subStreams collection at index: ${index}`,
        )
      } else {
        this.#subStreams.push(stream)
        log.grey('Added new subStream to subStreams collection', {
          stream,
          subStreamsCollection: this.getSubstreamsCollection(),
        })
      }
    } else {
      log.func('addToCollection')
      log.orange('The stream is already in the subStreams collection', {
        stream,
        subStreams: this.#subStreams,
      })
    }
    return this
  }

  getSubstreamsCollection() {
    return this.#subStreams
  }

  /**
   * Returns true if the element is already bound to a subStream in the
   * collection
   * @param { NDOMElement } node
   */
  elementExists(node: NDOMElement) {
    return this.#subStreams.some((subStream: Stream) => {
      return subStream.isSameElement(node)
    })
  }

  /**
   * Returns true if the participant is already bound to a subStream in
   * the collection
   * @param { RoomParticipant } participant
   */
  participantExists(participant: t.RoomParticipant) {
    return this.#subStreams.some(
      (subStream: Stream) => subStream && subStream.isParticipant(participant),
    )
  }

  /**
   * Returns the stream from the subStreams collection, null otherwise
   * @param { RoomParticipant } participant
   */
  getSubStream(participant: t.RoomParticipant) {
    const fn = (subStream: Stream) => subStream.isParticipant(participant)
    return this.findBy(fn)
  }

  /**
   * Loops over the subStreams collection and returns the first stream where
   * the predicate function returns truthy
   * @param { Stream } stream
   */
  findBy(cb: (stream: Stream) => boolean) {
    return this.#subStreams.find(cb)
  }

  findByParticipant(participant: t.RoomParticipant) {
    return this.#subStreams.find((s) => s.isParticipant(participant))
  }

  /**
   * Removes the given stream from the subStreams collection
   * If stream was passed as an index then it is used as the index to remove
   * the stream that is found at that position in the collection
   * @param { Stream | number } stream - Stream or index to remove
   */
  removeSubStream(stream: Stream): this
  removeSubStream(index: number): this
  removeSubStream(stream: Stream | number) {
    if (stream instanceof Stream) {
      const fn = (s: Stream) => s !== stream
      this.#subStreams = this.#subStreams.filter(fn)
      try {
        stream.removeElement()
        stream.unpublish()
      } catch (error) {
        console.error(error.message)
      }
    } else if (typeof stream === 'number') {
      const index = stream
      if (inRange(index, 0, this.#subStreams.length)) {
        this.#subStreams.splice(index, 1)
      }
    }
    return this
  }

  /** Returns the first subStream in the collection */
  first() {
    return this.#subStreams[0]
  }

  /** Returns the last subStream in the collection */
  last() {
    return last([...this.#subStreams])
  }

  reset() {
    this.#subStreams?.forEach?.((subStream) => subStream.reset())
    this.#subStreams = []
    this.blueprint = {} as ComponentObject
    this.container?.remove?.()
    this.container = null
    return this
  }

  snapshot() {
    return {
      children: this.getSubstreamsCollection().map((stream) =>
        stream.snapshot(),
      ),
      container: this.container,
      hasBlueprint: u.isObj(this.blueprint) && 'type' in this.blueprint,
      hasResolver: u.isFnc(this.resolver),
      length: this.length,
      type: 'subStreams',
    }
  }
}

export default MeetingSubstreams
