import _ from 'lodash'
import { NOODLComponent, NOODLComponentProps } from 'noodl-ui'
import { RemoteParticipant } from 'twilio-video'
import { NOODLElement } from 'app/types/pageTypes'
import { RoomParticipant } from 'app/types'
import Logger from 'app/Logger'
import Stream from './Stream'

const log = Logger.create('Substreams.ts')

/** The container for subStreams */
class MeetingSubstreams {
  #subStreams: Stream[] = []
  blueprint: Partial<NOODLComponent> = {} // Experimental
  container: NOODLElement

  constructor(container: NOODLElement, props: NOODLComponentProps) {
    this.container = container
    this.blueprint = props.blueprint
  }

  get length() {
    return this.#subStreams.length
  }

  /**
   * Adds a new stream instance to the subStreams collection. If a participant
   * was passed in, that participant's media tracks will automatically start
   * @param { NOODLElement? } node
   * @param { RemoteParticipant? } participant
   */
  add({
    node,
    participant,
  }: { node?: NOODLElement; participant?: RemoteParticipant } = {}) {
    log.func('add').gold('', node)
    const stream = new Stream('subStream', { node })
    if (node) {
      stream.setElement(node)
      if (!this.container.contains(node)) {
        this.container.appendChild(node)
      }
    }
    // Apply the blueprint onto the new node to align with the current items
    this.insertStream(stream)
    if (participant) {
      stream.setParticipant(participant)
    }
    return this
  }

  /**
   * Adds an element to the subStreams collection
   * If index is passed, it will insert the stream at the given index
   * @param { NOODLElement } node
   * @param { number? } index
   */
  addElement(node: NOODLElement, index?: number) {
    if (node) {
      const stream = new Stream('subStream', { node })
      // log.func('addElement')
      // forEachEntries(this.blueprint.style || {}, (key, value) => {
      //   node.style[key as keyof Styles] = value
      //   log.grey(`Applying style value of style.${key}`, this.blueprint.style)
      // })
      this.insertStream(stream)
    } else {
      log.func('addElement')
      log.red(`Cannot add an element if the node was null/undefined`)
    }
    return this
  }

  /**
   * Adds a participant to the subStreams collection on a stream that has an
   * available participant "slot"
   *
   * NOTE: This function assumes that a participant does NOT already exist in
   * the subStreams collection. Therefore be sure to call
   * .participantExists() to check before calling
   * @param { RoomParticipant } participant
   */
  addParticipant(participant: RoomParticipant) {
    if (participant) {
      let stream: Stream | undefined = undefined
      const indexEmptyParticipantSlot = this.getEmptyParticipantSlot()
      log.func('addParticipant')
      // Check if a stream does not have any participant bound to it
      if (indexEmptyParticipantSlot !== -1) {
        // Retrieve the index of the stream that doesn't have a
        // participant bound to it. Bind and load this participant's
        // tracks to the DOM
        stream = this.#subStreams[indexEmptyParticipantSlot]
        if (!stream) stream = new Stream('subStream')
        stream.setParticipant(participant)
        this.insertStream(stream)
        log.green(`Bound a participant to a subStream`, { participant, stream })
      } else {
        log.orange(
          `A stream was available to bind this participant to but received ` +
            `an invalid index. A new Stream will be created instead`,
          participant,
        )
        // Else start a new stream in the subStreams collection and attach this
        // participant to it (it does not have an element associated with it
        // yet unless stream.setElement is called with an element)
        stream = new Stream('subStream').setParticipant(participant)
        this.insertStream(stream)
      }
    }
    return this
  }

  /**
   * Returns true if the element is already bound to a subStream in the
   * collection
   * @param { NOODLElement } node
   */
  elementExists(node: NOODLElement) {
    return _.some(this.#subStreams, (subStream: Stream) => {
      return subStream.isSameElement(node)
    })
  }

  /**
   * Returns true if the participant is already bound to a subStream in
   * the collection
   * @param { RoomParticipant } participant
   */
  participantExists(participant: RoomParticipant) {
    return _.some(this.#subStreams, (subStream: Stream) => {
      return subStream.isSameParticipant(participant)
    })
  }

  /**
   * Returns the index of a subStream in the collection that doesn't have a
   * participant bound to it
   */
  getEmptyParticipantSlot() {
    const fn = (subStream: Stream) => !subStream.isAnyParticipantSet()
    return _.findIndex(this.#subStreams, fn)
  }

  /**
   * Returns the stream from the subStreams collection, null otherwise
   * @param { RoomParticipant } participant
   */
  getSubStream(participant: RoomParticipant) {
    const fn = (subStream: Stream) => subStream.isSameParticipant(participant)
    return _.find(this.#subStreams, fn)
  }

  /**
   * Inserts/pushes a stream into the subStreams collection
   * If an index is passed in, it will insert the stream at the index position
   * @param { Stream } stream
   * @param { number | undefined } index
   */
  insertStream(stream: Stream, index?: number) {
    if (!this.#subStreams.includes(stream)) {
      if (_.isNumber(index)) {
        this.#subStreams.splice(index, 0, stream)
      } else {
        this.#subStreams.push(stream)
      }
    } else {
      log.func('insertStream')
      log.orange('The stream is already in the subStreams collection', {
        stream,
        subStreams: this.#subStreams,
      })
    }
    return this
  }

  /**
   * Returns the remote participant if found (if argument is a participant instance)
   * Or returns the DOM node if found (if argument is a DOM node)
   * @param { RemoteParticipant | NOODLElement } v - Remote participant or a DOM node
   * @return { RemoteParticipant | NOODLElement | undefined }
   */
  getStream(v: RemoteParticipant | NOODLElement) {
    if (v instanceof HTMLElement) {
      return this.#subStreams.find((stream) => stream.isSameElement(v))
    } else {
      return this.#subStreams.find((stream) => stream.isSameParticipant(v))
    }
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
      this.#subStreams = _.filter(this.#subStreams, fn)
    } else if (_.isNumber(stream)) {
      const index = stream
      if (_.inRange(index, 0, this.#subStreams.length)) {
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
    return _.last(this.#subStreams)
  }
}

export default MeetingSubstreams
