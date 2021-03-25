import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { ndom } from './test-utils'

chai.use(sinonChai)
chai.use(chaiAsPromised)

let logSpy: sinon.SinonStub

before(() => {
  console.clear()
  logSpy = sinon.stub(global.console, 'log').callsFake(() => () => {})
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  ndom.reset()
})

after(() => {
  logSpy.restore()
})
