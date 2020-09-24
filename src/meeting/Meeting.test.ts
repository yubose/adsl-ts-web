import { expect } from 'chai'
import { getByDataUX, NOODLComponent, NOODLComponentProps } from 'noodl-ui'
import sinon from 'sinon'
import { noodl } from '../utils/test-utils'
import Meeting from './Meeting'
import Streams from './Streams'
import Substreams from './Substreams'
import Stream from './Stream'

class MockParticipant {
  sid = 'mysid123'
  identity = 'mike'
  tracks = new Map()
  on() {}
  off() {}
}

const mockSubstreamsProps = noodl.resolveComponents(
  getMockSubstreamsContainer(),
)[0]
const blueprint = mockSubstreamsProps.blueprint as NOODLComponentProps

let streams: Streams
let subStreams: Substreams
let selfStream: Stream
let mainStream: Stream
let participant: MockParticipant
let rootEl: HTMLDivElement

beforeEach(() => {
  Meeting.setInternal({ _room: { state: 'connected' } } as any)
  streams = Meeting.getStreams()
  subStreams = streams.createSubStreamsContainer(
    document.createElement('div'),
    mockSubstreamsProps,
  )
  selfStream = streams.getSelfStream()
  mainStream = streams.getMainStream()
  participant = new MockParticipant()
  rootEl = document.createElement('div')
  rootEl.id = 'VideoChat'
  rootEl.appendChild(subStreams.container)
  document.body.appendChild(rootEl)
})

afterEach(() => {
  Meeting.reset()
  rootEl.remove()
})

describe('Meeting', () => {
  describe('adding remote participants', () => {
    describe('when mainStream doesnt have any participants', () => {
      it('should assign the participant immediately to the mainStream', () => {
        expect(mainStream.isAnyParticipantSet()).to.be.false
        Meeting.addRemoteParticipant(participant)
        expect(mainStream.isAnyParticipantSet()).to.be.true
      })

      it('should try to publish their tracks when the stream has a DOM node', () => {
        const spy = sinon.stub(participant.tracks, 'forEach')
        mainStream.setElement(document.createElement('div'))
        Meeting.addRemoteParticipant(participant)
        expect(spy.called).to.be.true
        spy.restore()
      })

      it("should not try to publish their tracks when the stream doesn't have a DOM node", () => {
        const spy = sinon.stub(participant.tracks, 'forEach')
        Meeting.addRemoteParticipant(participant)
        expect(spy.called).to.be.false
        spy.restore()
      })
    })

    describe('when mainStream has a participant but is a different participant than the one being added', () => {
      beforeEach(() => {
        const otherParticipant = new MockParticipant()
        mainStream.setParticipant(otherParticipant)
      })

      describe('when subStreams doesnt have this participant anywhere', () => {
        it('should create a new stream and add it to the subStreams collection', () => {
          expect(subStreams).to.have.lengthOf(0)
          Meeting.addRemoteParticipant(participant)
          expect(subStreams).to.have.lengthOf(1)
          expect(subStreams.participantExists(participant)).to.be.true
        })

        it('should have created a node using the blueprint and attached it to the stream', () => {
          let stream = subStreams.getStream(participant)
          expect(stream).to.be.undefined
          Meeting.addRemoteParticipant(participant)
          stream = subStreams.getStream(participant)
          expect(stream.getElement()).to.be.instanceOf(HTMLElement)
        })

        it('should have attached the participant to the new stream ', () => {
          Meeting.addRemoteParticipant(participant)
          const stream = subStreams.getStream(participant)
          expect(stream.isSameParticipant(participant)).to.be.true
        })

        it("the new stream's DOM node should be showing on the DOM", () => {
          let node = getByDataUX('subStream')
          expect(node).to.be.null
          Meeting.addRemoteParticipant(participant)
          node = getByDataUX('subStream')
          expect(node).not.to.be.null
          expect(node).to.be.instanceOf(HTMLElement)
          expect(document.body.contains(node as HTMLElement))
        })
      })

      describe('when subStreams already has this participant in a subStream', () => {
        it('should not proceed to add a duplicate participant', () => {
          const mainStreamParticipant = new MockParticipant()
          const otherParticipant = new MockParticipant()
          mainStream.setParticipant(mainStreamParticipant)
          subStreams.addParticipant(otherParticipant)
          subStreams.addParticipant(participant)
          expect(subStreams.participantExists(participant)).to.be.true
          expect(subStreams).to.have.lengthOf(2)
          Meeting.addRemoteParticipant(participant)
          expect(subStreams.participantExists(participant)).to.be.true
          expect(subStreams).to.have.lengthOf(2)
        })
      })
    })

    describe('when the participant is already mainStreaming', () => {
      it('should try to find the same participant in the subStreams and remove it if found', () => {
        mainStream.setParticipant(participant)
        subStreams.addParticipant(participant)
        expect(subStreams.participantExists(participant)).to.be.true
        expect(mainStream.isSameParticipant(participant)).to.be.true
        Meeting.addRemoteParticipant(participant)
        expect(mainStream.isSameParticipant(participant)).to.be.true
        expect(subStreams.participantExists(participant)).to.be.false
      })
    })
  })

  describe('removing remote participants', () => {
    describe('when the participant was mainstreaming', () => {
      it.skip("should unpublish the participant's tracks", () => {
        // NOTE: dont forget to check that the video/audio nodes were removed
      })

      describe('when there is at least one participant subStreaming', () => {
        it.skip('should get the first participant from the subStreams list and assign it to be the new mainStream participant', () => {
          //
        })

        it.skip("should unpublish the participant's tracks that is being swapped", () => {
          //
        })

        it.skip('should detach the participant that is being swapped to mainStream from their subStream', () => {
          //
        })

        it.skip("should try to publish the new main stream participant's tracks", () => {
          //
        })
      })

      describe('when there is no participant subStreaming', () => {
        it.skip('', () => {
          //
        })
      })
    })

    describe('when the participant was subStreaming', () => {
      it.skip("should unpublish the participant's tracks", () => {
        //
      })

      it.skip('should remove the DOM node from the stream', () => {
        //
      })

      it.skip('should delete the stream from the subStreams collection', () => {
        //
      })
    })
  })
})

function getMockSubstreamsContainer() {
  return {
    type: 'list',
    contentType: 'vidoeSubStream',
    listObject: '',
    iteratorVar: 'itemObject',
    style: {
      axis: 'horizontal',
      left: '0.04',
      top: '0.62',
      width: '0.92',
      height: '0.15',
    },
    children: [
      {
        type: 'listItem',
        itemObject: '',
        style: {
          left: '0',
          top: '0',
          width: '0.18',
          height: '0.15',
          border: {
            style: '1',
          },
        },
        children: [
          {
            type: 'view',
            viewTag: 'subStream',
            style: {
              left: '0.015',
              top: '0',
              width: '0.15',
              height: '0.15',
              border: {
                style: '5',
              },
              borderRadius: '5',
            },
          },
        ],
      },
    ],
  } as NOODLComponent
}
