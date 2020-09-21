import { expect } from 'chai'
import _ from 'lodash'
import Stream from './Stream'

let tracks: Map<string, any>

beforeEach(() => {
  tracks = new Map()
  tracks.set('video1', {
    kind: 'video',
    track: { attach: _.noop, detach: _.noop },
  })
  tracks.set('audio1', {
    kind: 'audio',
    track: { attach: _.noop, detach: _.noop },
  })
})

describe('Stream', () => {
  it('should replace the previous sid + identity', () => {
    const participant: any = { sid: 'mySid', identity: 'myIdentity' }
    const node = document.createElement('div')
    node.innerText = 'hello'
    const stream = new Stream('subStream')
    expect(stream.previous.sid).to.be.undefined
    expect(stream.previous.identity).to.be.undefined
    stream.replaceParticipant(participant)
    expect(stream.previous.sid).to.eq(participant.sid)
    expect(stream.previous.identity).to.eq(participant.identity)
  })
})
