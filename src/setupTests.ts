import jsdom from 'jsdom-global'
jsdom(undefined, {
  url: 'http://localhost',
})
import chaiAsPromised from 'chai-as-promised'
import noop from 'lodash/noop'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import { ndom } from './utils/test-utils'

chai.use(sinonChai)
chai.use(chaiAsPromised)

let logStub: sinon.SinonStub
let invariantStub: sinon.SinonStub<any>

before(function () {
  console.clear()
  global.localStorage = window.localStorage
  logStub = sinon.stub(global.console, 'log').callsFake(() => noop)
  invariantStub = sinon.stub(global.console, 'error').callsFake(() => () => {})
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  ndom.reset()
  // ndom.page?.clearRootNode()
})

after(() => {
  logStub.restore()
  invariantStub.restore()
})
