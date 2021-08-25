import jsdom from 'jsdom-global'
import sinon from 'sinon'
jsdom(undefined, {
  url: 'http://localhost',
  runScripts: 'dangerously',
})
// @ts-expect-error
import MutationObserver from 'mutation-observer'
import noop from 'lodash/noop'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { getMostRecentApp, ndom } from './utils/test-utils'

chai.use(sinonChai)

let logStub: sinon.SinonStub
let invariantStub: sinon.SinonStub<any>

before(function () {
  // Correctly clears the console (tested on MAC)
  // process.stdout.write('\x1Bc')
  global.MutationObserver = MutationObserver
  global.localStorage = window.localStorage
  logStub = sinon.stub(global.console, 'log').callsFake(() => noop)
  // invariantStub = sinon.stub(global.console, 'error').callsFake(() => () => {})
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
  // invariantStub.restore()
})
