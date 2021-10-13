import jsdom from 'jsdom-global'
import sinon from 'sinon'
jsdom(undefined, {
  url: 'http://localhost',
  runScripts: 'dangerously',
})
import MutationObserver from 'mutation-observer'
import noop from 'lodash/noop'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { getMostRecentApp, ndom } from './utils/test-utils'

chai.use(sinonChai)

let logStub: sinon.SinonStub

before(function () {
  global.MutationObserver = MutationObserver
  global.localStorage = window.localStorage
  logStub = sinon.stub(global.console, 'log').callsFake(() => noop)
})

afterEach(() => {
  let app = getMostRecentApp()
  if (app) {
    app.reset()
  } else ndom.reset()
  document.head.textContent = ''
  document.body.textContent = ''
})

after(() => {
  logStub.restore()
})
