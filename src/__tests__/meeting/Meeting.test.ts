import * as mock from 'noodl-ui-test-utils'
import sinon from 'sinon'
import { RemoteParticipant } from 'twilio-video'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { coolGold, italic, magenta } from 'noodl-common'
import fs from 'fs-extra'
import path from 'path'
import { ComponentObject } from 'noodl-types'
import { expect } from 'chai'
import {
  asHtmlElement,
  getFirstByUX,
  getFirstByViewTag,
  getFirstByElementId,
  findByUX,
  findByViewTag,
  findByDataKey,
} from 'noodl-ui-dom'
import { initializeApp } from '../../utils/test-utils'
import getVideoChatPage from '../../__tests__/helpers/getVideoChatPage'
import Meeting from '../../meeting/Meeting'
import Stream from '../../meeting/Stream'
import Streams from '../../meeting/Streams'
import Substreams from '../../meeting/Substreams'
import * as u from '../../utils/common'
import * as dom from '../../utils/dom'
import getVideoChatPageObject from '../../__tests__/helpers/getVideoChatPage'

class MockParticipant {
  sid = u.getRandomKey()
  identity = 'mike'
  tracks = new Map()
  audioTracks = new Map()
  videoTracks = new Map()
  on() {}
  once() {}
  off() {}
}

let subStreams: Substreams
let selfStream: Stream
let mainStream: Stream
let participant: any

// @ts-expect-error
const getMockParticipant = () => new MockParticipant() as RemoteParticipant

const getApp = async ({
  room,
  navigate,
}: Partial<Parameters<typeof initializeApp>[0]> & {
  navigate?: boolean
} = {}) => {
  const app = await initializeApp({
    pageName: 'VideoChat',
    pageObject: getVideoChatPageObject(),
    room: { state: 'connected', ...room },
  })
  if (navigate) await app.navigate('VideoChat')
  return app
}

describe('Meeting', () => {
  xdescribe('when leaving the meeting', () => {
    //
  })

  describe('when adding participants', () => {
    it(`should find at least 1 "Waiting for others to join" element`, async () => {
      const app = await getApp({ navigate: true })
      expect(
        app.meeting.getWaitingMessageElements(),
      ).to.have.length.greaterThan(0)
    })

    it('should hide the "Waiting for others to join" message when there are participants', async () => {
      const app = await initializeApp({ room: { participants: { hello: {} } } })
      await app.navigate('VideoChat')
      app.meeting
        .getWaitingMessageElements()
        .forEach((elem) => expect(dom.isVisible(elem)).to.be.true)
      app.meeting
        .addRemoteParticipant(getMockParticipant())
        .getWaitingMessageElements()
        .forEach((elem) => expect(dom.isVisible(elem)).to.be.false)
    })

    it('should show the "Waiting for others to join" message when there are no participants', async () => {
      const app = await getApp({ navigate: true })
      app.meeting
        .getWaitingMessageElements()
        .forEach((elem) => expect(dom.isVisible(elem)).to.be.true)
    })

    describe('when mainStream doesnt have any participants', () => {
      it('should assign the participant immediately to the mainStream', async () => {
        const app = await getApp({ navigate: true })
        const mainStream = app.meeting.streams.getMainStream()
        expect(mainStream.isAnyParticipantSet()).to.be.false
        app._test.addParticipant(getMockParticipant())
        expect(mainStream.isAnyParticipantSet()).to.be.true
      })

      it('should try to publish their tracks when the stream has a DOM node', async () => {
        const app = await getApp({ navigate: true })
        const participant = getMockParticipant()
        const spy = sinon.stub(participant.tracks, 'forEach')
        app.streams.mainStream.setElement(document.createElement('div'))
        app._test.addParticipant(participant)
        expect(spy.called).to.be.true
        spy.restore()
      })
    })

    it.only(
      `should create a new stream inside subStreams with the new participant ` +
        `if mainStream is occupied by another participant`,
      async () => {
        const app = await getApp({ navigate: true })
        expect(app.streams.subStreams).to.have.lengthOf(0)
        app._test.addParticipant(getMockParticipant())
        expect(app.streams.subStreams).to.have.lengthOf(1)
        // expect(app.streams.subStreams?.participantExists(participant)).to.be
        //   .true
      },
    )

    describe(
      `when mainStream has a participant but is a different participant ` +
        `than the one being added`,
      () => {
        let mainParticipant: MockParticipant

        beforeEach(() => {
          mainParticipant = new MockParticipant()
          mainStream.setParticipant(mainParticipant as any)
        })

        describe('when subStreams doesnt have this participant anywhere', () => {
          it('should create a new stream and create it to the subStreams collection', () => {
            expect(subStreams).to.have.lengthOf(0)
            Meeting.addRemoteParticipant(participant)
            expect(subStreams).to.have.lengthOf(1)
            expect(subStreams.participantExists(participant)).to.be.true
          })

          xit('should have created a node using the blueprint and attached it to the stream', () => {
            let stream = subStreams.findBy((s) =>
              s.isSameParticipant(participant),
            )
            expect(stream).to.be.undefined
            Meeting.addRemoteParticipant(participant)
            stream = subStreams.findBy((s) => s.isSameParticipant(participant))
            expect(stream?.getElement()).to.be.instanceOf(HTMLElement)
          })

          it('should have attached the participant to the new stream ', () => {
            Meeting.addRemoteParticipant(participant)
            const stream = subStreams.findBy((s) =>
              s.isSameParticipant(participant),
            )
            expect(stream?.isSameParticipant(participant)).to.be.true
          })
        })

        describe('when subStreams already has this participant in a subStream', () => {
          it('should not proceed to create a duplicate participant', () => {
            const mainStreamParticipant = new MockParticipant() as any
            const otherParticipant = new MockParticipant() as any
            mainStream.setParticipant(mainStreamParticipant)
            subStreams.create({
              node: document.createElement('div'),
              participant: otherParticipant as any,
            })
            subStreams.create({
              node: document.createElement('div'),
              participant: participant as any,
            })
            expect(subStreams.participantExists(participant)).to.be.true
            expect(subStreams).to.have.lengthOf(2)
            Meeting.addRemoteParticipant(participant)
            expect(subStreams.participantExists(participant)).to.be.true
            expect(subStreams).to.have.lengthOf(2)
          })
        })
      },
    )

    describe('when the participant is already mainStreaming', () => {
      it('should try to find the same participant in the subStreams and remove it if found', () => {
        const subStreamsContainer = document.createElement('div')
        mainStream.setParticipant(participant)
        subStreams.create({ node: subStreamsContainer, participant })
        expect(subStreams.participantExists(participant)).to.be.true
        expect(mainStream.isSameParticipant(participant)).to.be.true
        Meeting.addRemoteParticipant(participant)
        expect(mainStream.isSameParticipant(participant)).to.be.true
        expect(subStreams.participantExists(participant)).to.be.false
      })
    })
  })

  describe('removing remote participants', () => {
    let mainParticipant: any
    let otherParticipant1: any
    let otherParticipant2: any

    beforeEach(() => {
      mainParticipant = new MockParticipant()
      otherParticipant1 = new MockParticipant()
      otherParticipant2 = new MockParticipant()
      mainStream.setParticipant(mainParticipant)
      selfStream.setParticipant(participant)
      subStreams.create({
        node: document.createElement('div'),
        participant: otherParticipant1 as any,
      })
      subStreams.create({
        node: document.createElement('div'),
        participant: otherParticipant2 as any,
      })
    })

    describe('when the participant was mainstreaming', () => {
      it("should unpublish the participant's tracks", () => {
        const spy = sinon.spy(mainParticipant.tracks, 'forEach')
        // NOTE: dont forget to check that the video/audio nodes were removed
        expect(spy.called).to.be.false
        expect(mainStream.getParticipant()).to.equal(mainParticipant)
        mainStream.unpublish().detachParticipant()
        expect(spy.called).to.be.true
        spy.restore()
      })

      describe('when there is at least one participant subStreaming', () => {
        it('should get the first participant from the subStreams list and assign it to be the new mainStream participant', () => {
          Meeting.removeRemoteParticipant(mainParticipant)
          expect(mainStream.getParticipant()).to.equal(otherParticipant1)
          expect(subStreams).to.have.lengthOf(1)
          expect(subStreams.participantExists(otherParticipant1)).to.be.false
        })

        it("should unpublish the participant's tracks that is being swapped", () => {
          const otherParticipant1SubStream = subStreams.findBy((s) =>
            s.isSameParticipant(otherParticipant1),
          )
          // const spy = sinon.spy(otherParticipant1.tracks, 'forEach')
          const spy = sinon.spy(otherParticipant1SubStream as any, 'unpublish')
          Meeting.removeRemoteParticipant(mainParticipant)
          expect(spy.called).to.be.true
        })

        it('should detach the participant that is being swapped to mainStream from their subStream', () => {
          const otherParticipant1Stream = subStreams.findBy((s) =>
            s.isSameParticipant(otherParticipant1),
          )
          expect(mainStream.isSameParticipant(mainParticipant)).to.be.true
          expect(otherParticipant1Stream?.isSameParticipant(otherParticipant1))
            .to.be.true
          Meeting.removeRemoteParticipant(mainParticipant)
          expect(otherParticipant1Stream?.isSameParticipant(otherParticipant1))
            .to.be.false
          expect(subStreams).to.have.lengthOf(1)
        })

        xit("should try to publish the new main stream participant's tracks", () => {
          const otherParticipant1Stream = subStreams.findBy((s) =>
            s.isSameParticipant(otherParticipant1),
          )
          // const spy = sinon.spy(otherParticipant1Stream,)
          Meeting.removeRemoteParticipant(mainParticipant)
        })
      })
    })

    describe('when the participant was subStreaming', () => {
      it("should try to unpublish the participant's tracks", () => {
        const stream = subStreams.findBy((v) =>
          v.isSameParticipant(otherParticipant1),
        )
        const spy = sinon.spy(stream as Stream, 'unpublish')
        Meeting.removeRemoteParticipant(otherParticipant1)
        expect(spy.called).to.be.true
      })

      it('should remove the DOM node from the stream', () => {
        const stream = subStreams.findBy((stream) =>
          stream.isSameParticipant(otherParticipant2),
        )
        const node = stream?.getElement()
        expect(document.body.contains(node as HTMLElement)).to.be.true
        Meeting.removeRemoteParticipant(otherParticipant2)
        expect(document.body.contains(node as HTMLElement)).to.be.false
      })

      it('should remove the DOM node from the DOM', () => {
        const stream = subStreams.findBy((stream) =>
          stream.isSameParticipant(otherParticipant2),
        )
        const node = stream?.getElement()
        expect(document.body.contains(node as HTMLElement)).to.be.true
        Meeting.removeRemoteParticipant(otherParticipant2)
        expect(document.body.contains(node as HTMLElement)).to.be.false
      })

      it('should delete the stream from the subStreams collection', () => {
        const stream = subStreams.findBy((v) =>
          v.isSameParticipant(otherParticipant1),
        )
        expect(
          subStreams.findBy((s) => s.isSameParticipant(otherParticipant1)),
        ).to.equal(stream)
        Meeting.removeRemoteParticipant(otherParticipant2)
        expect(subStreams.findBy((s) => s.isSameParticipant(otherParticipant2)))
          .to.be.undefined
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
  } as ComponentObject
}
