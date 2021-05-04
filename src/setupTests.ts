import jsdom from 'jsdom-global'
import sinon from 'sinon'
jsdom(undefined, {
  url: 'http://localhost',
  runScripts: 'dangerously',
  beforeParse(window) {
    // Object.defineProperty(window.EventTarget, 'addEventListener', {
    //   value: sinon.stub(),
    // })
    // Object.defineProperty(global.EventTarget, 'addEventListener', {
    //   value: sinon.stub(),
    // })
    // Object.defineProperty(global.EventTarget, 'addEventListener', {
    //   value: sinon.stub(),
    // })
    // window.EventTarget.prototype.removeEventListener = sinon.stub()
  },
})
// @ts-expect-error
import MutationObserver from 'mutation-observer'
import { prettyDOM } from '@testing-library/dom'
import chaiAsPromised from 'chai-as-promised'
import noop from 'lodash/noop'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { defaultResolvers } from 'noodl-ui-dom'
import { getMostRecentApp, ndom } from './utils/test-utils'

chai.use(sinonChai)
chai.use(chaiAsPromised)

let logStub: sinon.SinonStub
let invariantStub: sinon.SinonStub<any>

before(function () {
  // Correctly clears the console (tested on MAC)
  process.stdout.write('\x1Bc')
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
  // TODO - Put this in noodl-ui-dom's reset func
  Object.values(defaultResolvers).forEach((r) => ndom.register(r))
})

after(() => {
  logStub.restore()
  // invariantStub.restore()
})
