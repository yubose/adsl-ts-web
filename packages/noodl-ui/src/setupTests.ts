import _ from 'lodash'
import sinon from 'sinon'
import Logger, { _color } from 'logsnap'
import { noodlui } from './utils/test-utils'

let logSpy: sinon.SinonStub

before(async () => {
  console.clear()
  Logger.disable()
  try {
    logSpy = sinon.stub(global.console, 'log').callsFake(() => _.noop)
  } catch (error) {}
})

after(() => {
  logSpy?.restore?.()
})

afterEach(() => {
  document.body.textContent = ''
  noodlui.cleanup()
})
