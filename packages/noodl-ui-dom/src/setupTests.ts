import _ from 'lodash'
import sinon from 'sinon'
import Logger from 'logsnap'
import { noodlui, listenToDOM } from './test-utils'

let logSpy: sinon.SinonStub

before(() => {
  console.clear()
  Logger.disable()
  logSpy = sinon.stub(global.console, 'log').callsFake(() => _.noop)
})

beforeEach(() => {
  listenToDOM()
})

after(() => {
  logSpy?.restore?.()
})

afterEach(() => {
  document.body.textContent = ''
  noodlui.reset()
})
