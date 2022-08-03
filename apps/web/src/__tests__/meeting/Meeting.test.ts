// @ts-nocheck
import * as mock from 'noodl-ui-test-utils'
import * as u from '@jsmanifest/utils'
import sinon from 'sinon'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { coolGold, italic, magenta } from 'noodl-common'
import { expect } from 'chai'
import { asHtmlElement, findByGlobalId } from 'noodl-ui-dom'
import { getApp as _getApp } from '../../utils/test-utils'
import Stream from '../../meeting/Stream'
import getMockParticipant from '../helpers/getMockParticipant'
import * as dom from '../../utils/dom'

const getApp: typeof _getApp = async (args) => {
  return _getApp({ ...args, preset: 'meeting' })
}

describe(coolGold(`Meeting`), () => {
  describe(`when connecting to a room`, () => {
    describe(`when there are participants in the room`, () => {
      it(`should call the ${magenta(
        `twilioOnPeopleJoin`,
      )} register event`, async () => {
        const participant = getMockParticipant()
        const app = await getApp({
          room: {
            participants: { [participant.sid]: participant },
          },
        })
        const spy = sinon.spy(
          app.nui.cache.register.get('_global', 'twilioOnPeopleJoin'),
          'fn',
        )
        await app.navigate('VideoChat')
        spy.restore()
        expect(spy).to.be.calledOnce
      })
    })
  })

  describe(italic(`when adding participants`), () => {
    /*
        TODO - See if testing using this is easier/betteer
        nui.emit({ type: 'register', event: 'twilioOnPeopleJoin', params: { room: app.meeting.room }})
    */
    it(`should find at least 1 "Waiting for others to join" element`, async () => {
      const app = await getApp({ navigate: true })
      expect(
        app.meeting.getWaitingMessageElements(),
      ).to.have.length.greaterThan(0)
    })

    it('should hide the "Waiting for others to join" message when there are participants', async () => {
      const app = await getApp({ navigate: true })
      app.meeting
        .getWaitingMessageElements()
        .forEach((elem) => expect(dom.isVisible(elem)).to.be.true)
      app.meeting.addRemoteParticipant(getMockParticipant())
      app.meeting.addRemoteParticipant(getMockParticipant())
      await waitFor(() => {
        app.meeting
          .getWaitingMessageElements()
          .forEach((elem) => expect(dom.isVisible(elem)).to.be.false)
      })
    })

    it('should show the "Waiting for others to join" message when there are no participants', async () => {
      const app = await getApp({ navigate: true })
      app.meeting
        .getWaitingMessageElements()
        .forEach((elem) => expect(dom.isVisible(elem)).to.be.true)
    })

    describe('when mainStream doesnt have any participants', () => {
      it(`should attach the participant to the mainStream if the slot is available`, async () => {
        const app = await getApp({ navigate: true })
        const { mainStream } = app.streams
        const mainStreamParticipant = getMockParticipant()
        expect(mainStream.hasParticipant()).to.be.false
        app._test.addParticipant(mainStreamParticipant)
        expect(mainStream.hasParticipant()).to.be.true
        expect(mainStream.isParticipant(mainStreamParticipant)).to.be.true
      })

      it('should try to publish their tracks when the stream has a DOM node', async () => {
        const app = await getApp({ navigate: true })
        const { mainStream } = app.streams
        const participant = getMockParticipant()
        const spy = sinon.stub(participant.tracks, 'forEach')
        mainStream.setElement(document.createElement('div'))
        app._test.addParticipant(participant)
        expect(spy.called).to.be.true
        spy.restore()
      })
    })

    it(
      `should create a new stream in subStreams with the participant ` +
        `if mainStream is occupied by another participant`,
      async () => {
        const app = await getApp({ navigate: true })
        const { mainStream, subStreams } = app.streams
        const mainStreamParticipant = getMockParticipant()
        const subStreamParticipant = getMockParticipant()
        expect(subStreams).to.exist
        expect(subStreams).to.have.lengthOf(0)
        app._test.addParticipant(mainStreamParticipant)
        expect(subStreams).to.have.lengthOf(0)
        app._test.addParticipant(subStreamParticipant)
        expect(subStreams).to.have.lengthOf(1)
        expect(mainStream.getParticipant()).to.eq(mainStreamParticipant)
        expect(subStreams?.first().getParticipant()).to.eq(subStreamParticipant)
        expect(mainStream.getParticipant()).to.not.eq(
          subStreams?.first().getParticipant(),
        )
        expect(subStreams?.participantExists(mainStreamParticipant)).to.be.false
        expect(subStreams?.participantExists(subStreamParticipant)).to.be.true
      },
    )

    xit(
      `should create a new stream in subStreams with the participant ` +
        `if mainStream is occupied by another participant and is not already in ` +
        `one of the streams in the subStreams collection`,
      () => {
        //
      },
    )

    xdescribe('when subStreams already has this participant in a subStream', () => {
      it('should not create a new or duplicate participant', async () => {
        const app = await getApp({ navigate: true })
        const { mainStream, subStreams } = app.streams
        const mainStreamParticipant = getMockParticipant()
        const subStreamParticipant = getMockParticipant()
        app._test.addParticipant(mainStreamParticipant)
        app._test.addParticipant(subStreamParticipant)
        expect(mainStream.getParticipant()).not.to.eq(subStreamParticipant)
        expect(subStreams?.participantExists(subStreamParticipant)).to.be.true
        expect(subStreams).to.have.lengthOf(1)
        app._test.addParticipant(subStreamParticipant)
        expect(subStreams).to.have.lengthOf(1)
      })
    })
  })

  describe('when removing participants', () => {
    describe('when the participant was mainstreaming', () => {
      it(`should remove the participant from the mainStream`, async () => {
        const app = await getApp({ navigate: true })
        const { mainStream } = app.streams
        const mainStreamParticipant = getMockParticipant()
        app._test.addParticipant(mainStreamParticipant)
        expect(mainStream.hasParticipant()).to.be.true
        app.meeting.removeRemoteParticipant(mainStreamParticipant)
        expect(mainStream.hasParticipant()).to.be.false
        expect(mainStream.getParticipant()).not.to.eq(mainStreamParticipant)
      })

      it("should unpublish the participant's tracks", async () => {
        const app = await getApp({ navigate: true })
        const { mainStream } = app.streams
        const mainStreamParticipant = getMockParticipant()
        app._test.addParticipant(mainStreamParticipant)
        const spy = sinon.spy(mainStreamParticipant.tracks, 'forEach')
        // NOTE: dont forget to check that the video/audio nodes were removed
        expect(spy.called).to.be.false
        expect(mainStream.getParticipant()).to.equal(mainStreamParticipant)
        mainStream?.unpublish()
        expect(spy.called).to.be.true
        spy.restore()
      })

      describe('when there is at least one participant subStreaming', () => {
        it(
          `should get the first participant from the subStreams list and assign ` +
            `it to be the new mainStream participant`,
          async () => {
            const app = await getApp({ navigate: true })
            const { mainStream, subStreams } = app.streams
            const mainStreamParticipant = getMockParticipant()
            const subStreamParticipant = getMockParticipant()
            app._test.addParticipant(mainStreamParticipant)
            app._test.addParticipant(subStreamParticipant)
            expect(subStreams).to.have.lengthOf(1)
            app.meeting.removeRemoteParticipant(mainStreamParticipant)
            expect(mainStream.getParticipant()).to.equal(subStreamParticipant)
            expect(subStreams).to.have.lengthOf(0)
            expect(subStreams?.participantExists(subStreamParticipant)).to.be
              .false
          },
        )

        it("should unpublish the participant's tracks that is being swapped", async () => {
          const app = await getApp({ navigate: true })
          const { subStreams } = app.streams
          const mainStreamParticipant = getMockParticipant()
          const subStreamParticipant = getMockParticipant()
          app._test.addParticipant(mainStreamParticipant)
          app._test.addParticipant(subStreamParticipant)
          const subStream = subStreams?.findByParticipant(
            subStreamParticipant,
          ) as Stream
          const spy = sinon.spy(subStream, 'unpublish')
          app.meeting.removeRemoteParticipant(mainStreamParticipant)
          expect(spy.called).to.be.true
          spy.restore()
        })

        it(
          `should detach the participant that is being swapped to mainStream ` +
            `from their subStream`,
          async () => {
            const app = await getApp({ navigate: true })
            const { mainStream, subStreams } = app.streams
            const mainStreamParticipant = getMockParticipant()
            const subStreamParticipant = getMockParticipant()
            app._test.addParticipant(mainStreamParticipant)
            app._test.addParticipant(subStreamParticipant)
            const subStream = subStreams?.findByParticipant(
              subStreamParticipant,
            ) as Stream
            expect(mainStream.isParticipant(mainStreamParticipant)).to.be.true
            expect(subStream?.isParticipant(subStreamParticipant)).to.be.true
            app.meeting.removeRemoteParticipant(mainStreamParticipant)
            expect(subStream?.isParticipant(subStreamParticipant)).to.be.false
            expect(subStream.hasParticipant()).to.be.false
            expect(subStreams?.participantExists(subStreamParticipant)).to.be
              .false
          },
        )
      })
    })

    describe('when the participant was subStreaming', () => {
      it("should try to unpublish the participant's tracks", async () => {
        const app = await getApp({ navigate: true })
        const { subStreams } = app.streams
        const mainStreamParticipant = getMockParticipant()
        const subStreamParticipant = getMockParticipant()
        app._test.addParticipant(mainStreamParticipant)
        app._test.addParticipant(subStreamParticipant)
        const subStream = subStreams?.findByParticipant(
          subStreamParticipant,
        ) as Stream
        const spy = sinon.spy(subStream, 'unpublish')
        app.meeting.removeRemoteParticipant(subStreamParticipant)
        expect(spy.called).to.be.true
        spy.restore()
      })

      it('should remove the DOM node from the stream', async () => {
        const app = await getApp({ navigate: true })
        const mainStreamParticipant = getMockParticipant()
        const subStreamParticipant = getMockParticipant()
        app._test.addParticipant(mainStreamParticipant)
        app._test.addParticipant(subStreamParticipant)
        const { subStreams } = app.streams
        const subStream = subStreams?.findByParticipant(
          subStreamParticipant,
        ) as Stream
        const node = subStream?.getElement()
        expect(document.body.contains(node as HTMLElement)).to.be.true
        app.meeting.removeRemoteParticipant(subStreamParticipant)
        expect(document.body.contains(node as HTMLElement)).to.be.false
      })

      it('should remove the DOM node from the DOM', async () => {
        const app = await getApp({ navigate: true })
        const { subStreams } = app.streams
        const mainStreamParticipant = getMockParticipant()
        const subStreamParticipant = getMockParticipant()
        app._test.addParticipant(mainStreamParticipant)
        app._test.addParticipant(subStreamParticipant)
        const subStream = subStreams?.findByParticipant(subStreamParticipant)
        const node = subStream?.getElement()
        expect(document.body.contains(node as HTMLElement)).to.be.true
        // app.meeting.removeRemoteParticipant(subStreamParticipant)
        // expect(document.body.contains(node as HTMLElement)).to.be.false
      })

      it('should delete the stream from the subStreams collection', async () => {
        const mainStreamParticipant = getMockParticipant()
        const subStreamParticipant = getMockParticipant()
        const app = await getApp({ navigate: true })
        const { subStreams } = app.streams
        app._test.addParticipant(mainStreamParticipant)
        app._test.addParticipant(subStreamParticipant)
        const subStream = subStreams?.findByParticipant(subStreamParticipant)
        expect(subStreams?.findByParticipant(subStreamParticipant)).to.equal(
          subStream,
        )
        app.meeting.removeRemoteParticipant(subStreamParticipant)
        expect(subStreams?.findByParticipant(subStreamParticipant)).to.be
          .undefined
      })
    })
  })

  describe(`when using global popUp in a meeting`, () => {
    describe(`when navigating away`, () => {
      it(`should not have disconnected from the room`, async () => {
        const app = await getApp()
        await app.meeting.join('token')
        expect(app.meeting.room.state).to.eq('connected')
        await app.navigate('VideoChat')
        expect(app.meeting.room.state).to.eq('connected')
      })

      xit(`should still have tracks on`, () => {
        //
      })

      xit(`should still have all streams in memory`, () => {
        //
      })

      xit(`should still have all DOM nodes in memory`, () => {
        //
      })
    })
  })
})
