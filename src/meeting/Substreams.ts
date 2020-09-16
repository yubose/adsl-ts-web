import _ from 'lodash'
import { NOODLElement } from 'app/types/pageTypes'
import Stream from './Stream'
import { RoomParticipant } from 'app/types'

/** The container for subStreams */
class MeetingSubstreams {
  container: NOODLElement
  subStreams: Stream[] = []

  constructor(container: NOODLElement) {
    this.container = container
  }

  add(participant: RoomParticipant): this
  add(node: NOODLElement): this
  add(node: NOODLElement | RoomParticipant) {
    if (node) {
      if (node instanceof Element) {
        this.subStreams.push(new Stream('subStream', node))
      } else {
        const participant = node
        if (!this.participantExists(participant)) {
          let stream: Stream
          if (this.hasAvailableParticipantSlot()) {
            const index = this.getEmptyParticipantSlot()
            if (index !== -1) {
              stream = this.subStreams[index]
              stream.setParticipant(participant)
            } else {
              // TODO
            }
            stream = new Stream('selfStream')
            stream.setParticipant(participant)
            this.subStreams.push(stream)
          } else {
            // TODO
            stream = new Stream('selfStream')
            stream.setParticipant(participant)
            this.subStreams.push(stream)
          }
        } else {
          // TODO
        }
      }
    }
    return this
  }

  /**
   * Returns true if the element is already in the list of subStreams
   * @param { NOODLElement } node
   */
  elementExists(node: NOODLElement) {
    return _.filter(this.subStreams, (subStream: Stream) => {
      return subStream.isSameElement(node)
    })
  }

  /**
   * Returns true if the participant is already in the list of subStreams
   * @param { RoomParticipant } participant
   */
  participantExists(participant: RoomParticipant) {
    return _.filter(this.subStreams, (subStream: Stream) => {
      return subStream.isSameParticipant(participant)
    })
  }

  hasAvailableParticipantSlot() {
    return _.some(this.subStreams, (subStream) => {
      return !subStream.participant
    })
  }

  getEmptyParticipantSlot() {
    return _.findIndex(this.subStreams, (subStream) => !subStream.participant)
  }
}

export default MeetingSubstreams
