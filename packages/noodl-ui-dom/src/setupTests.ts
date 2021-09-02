import JSDOM from 'jsdom-global'
import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { _syncPages } from './utils/internal'

JSDOM('', {
  resources: 'usable',
  runScripts: 'dangerously',
  url: 'http://localhost:3000',
})

chai.use(sinonChai)

let logStub: sinon.SinonStub
// let invariantStub: sinon.SinonStub<any>

before(() => {
  // invariantStub = sinon.stub(global.console, 'error').callsFake(() => {})
  logStub = sinon.stub(global.console, 'log').callsFake(() => () => {})
})

beforeEach(() => {
  // ndom.resync()
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  // ndom.reset()
})

after(() => {
  logStub.restore()
  // invariantStub.restore()
})
