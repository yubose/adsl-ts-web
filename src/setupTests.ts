import jsdom from 'jsdom-global'
jsdom(undefined, {
  url: 'http://localhost',
})
import noop from 'lodash/noop'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import { ndom } from './utils/test-utils'

chai.use(sinonChai)

let logSpy: sinon.SinonStub
// let errSpy: sinon.SinonStub

before(function () {
  global.localStorage = window.localStorage
  console.clear()
  logSpy = sinon.stub(global.console, 'log').callsFake(() => noop)
  // errSpy = sinon.stub(global.console, 'error').callsFake(() => noop)
})

after(() => {
  logSpy.restore()
  // errSpy.restore()
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  ndom.reset()
})
