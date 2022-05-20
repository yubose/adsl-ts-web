import { expect } from 'chai'
import sinon from 'sinon'
import * as fp from '../utils/fp'
import * as is from '../utils/is'
import deref from '../deref'
import Diagnostics from '../diagnostics/Diagnostics'
import Root from '../Root'
import Visitor from '../Visitor'
import * as t from '../types'

let diagnostics: Diagnostics
let root: t.ARoot
let visitor: Visitor

beforeEach(() => {
  diagnostics = new Diagnostics()
  root = new Root()
  visitor = new Visitor()
  diagnostics.use(root)
  diagnostics.use(visitor)

  root.set('BaseHeader', {
    type: 'header',
    style: { width: '1', height: 'auto', top: '0.1', left: '0.125' },
  })

  root.set('Cereal', {
    icon: '..realIcon',
    realIcon: 'you-found-me.png',
    components: [
      '.BaseHeader',
      { type: 'button', text: '..icon' },
      { type: 'label', text: '..iconName' },
    ],
  })
})

describe(`Diagnostics`, () => {
  it(`[init] should call init before visiting`, () => {
    const spy = sinon.spy()
    const spy2 = sinon.spy()
    diagnostics.run({ enter: spy2, init: spy })
    expect(spy2.getCall(0)['callId']).to.be.greaterThan(
      spy.getCall(0)['callId'],
    )
  })

  it(`[init] should provide data, root, and helpers as args`, () => {
    const spy = sinon.spy()
    diagnostics.run({ enter: () => {}, init: spy })
    expect(spy.args)
    expect(spy.args[0][0]).to.have.property('data').to.exist
    expect(spy.args[0][0]).to.have.property('helpers')
    expect(spy.args[0][0]).to.have.property('root', root)
  })
})
