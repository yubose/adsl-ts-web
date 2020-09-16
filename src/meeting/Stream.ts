import _ from 'lodash'
import { NOODLElement } from 'app/types/pageTypes'
import Logger from 'app/Logger'
import { RoomParticipant, StreamType } from 'app/types'

const log = Logger.create('Streams.ts')

class MeetingStream {
  #node: NOODLElement | null = null
  previous: { sid?: string; identity?: string } = {}
  participant: RoomParticipant | null = null
  type: StreamType | null = null

  constructor(type: StreamType, node?: NOODLElement) {
    if (node) this.#node = node
    this.type = type
  }

  getElement() {
    return this.#node
  }

  /**
   * Sets the node to this instance
   * @param { NOODLElement | null } node
   */
  setElement(node: NOODLElement | null) {
    this.#node = node
    return this
  }

  /**
   * Returns true if the node is already set on this instance
   * @param { NOODLElement } node
   */
  isSameElement(node: NOODLElement) {
    return this.#node === node
  }

  isSameParticipant(participant: RoomParticipant) {
    return this.participant === participant
  }

  /**
   * Sets the participant's sid as a data- attribute as well as assigns it
   * to this instance
   * @param { RoomParticipant } participant
   */
  setParticipant(participant: RoomParticipant) {
    if (participant) {
      this.participant = participant
      if (this.#node) {
        this.#node.dataset['sid'] = participant.sid
      }
      this.previous.sid = participant.sid
      this.previous.identity = participant.identity
    } else {
      log.func(`[${this.type}] setParticipant`)
      log.red(
        `Tried to set participant on this stream but it was null or undefined`,
        { type: this.type, participant },
      )
    }
    return this
  }

  /** Re-queries for the currrent participant's tracks and assigns them to this
   * node if they aren't set */
  reloadTracks() {
    if (!this.#node) {
      return
    }

    if (!this.participant) {
      return
    }

    if (this.#node.dataset.sid !== this.participant.sid) {
      this.#node.dataset['sid'] = this.participant.sid
    }
  }
}

export default MeetingStream
