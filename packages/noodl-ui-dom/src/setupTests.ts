import * as u from '@jsmanifest/utils'
import JSDOM from 'jsdom-global'
import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { _syncPages } from './utils/internal'
import { ndom } from './test-utils'

JSDOM('', {
  resources: 'usable',
  runScripts: 'dangerously',
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
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
  // console.info(`[${u.yellow('afterEach')}] cleanup start`)
  ndom.reset()
  ndom.resync()
  // console.info(`[${u.yellow('afterEach')}] cleanup end`)
})

after(() => {
  logStub.restore()
  // invariantStub.restore()
})
