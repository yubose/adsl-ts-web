import JSDOM from 'jsdom-global'
import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { ndom } from './test-utils'

JSDOM('', {
  resources: 'usable',
  runScripts: 'dangerously',
  // pretendToBeVisual: true,
})

chai.use(sinonChai)
chai.use(chaiAsPromised)

let logStub: sinon.SinonStub
// let invariantStub: sinon.SinonStub<any>

before(() => {
  // invariantStub = sinon.stub(global.console, 'error').callsFake(() => {})
  logStub = sinon.stub(global.console, 'log').callsFake(() => () => {})
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  ndom.reset()
  // _syncPages.call(ndom)
})

after(() => {
  logStub.restore()
  // invariantStub.restore()
  console.info(ndom)
})
