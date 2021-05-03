import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { ndom } from './test-utils'

chai.use(sinonChai)
chai.use(chaiAsPromised)

let logStub: sinon.SinonStub
let invariantStub: sinon.SinonStub<any>

before(() => {
  process.stdout.write('\x1Bc')
  invariantStub = sinon.stub(global.console, 'error').callsFake(() => {})
  logStub = sinon.stub(global.console, 'log').callsFake(() => () => {})
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  ndom.reset()
})

after(() => {
  logStub.restore()
  invariantStub.restore()
})
