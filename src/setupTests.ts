import _ from 'lodash'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import Logger, { _color } from 'logsnap'
import { noodluidom } from './utils/test-utils'

chai.use(chaiAsPromised)

let logSpy: sinon.SinonStub
let logger: sinon.SinonStub

before(async () => {
  console.clear()
  // Silence all the logging from our custom logger
  logSpy = sinon.stub(global.console, 'log')
  logger = sinon.stub(Logger, 'create')
})

after(() => {
  logSpy.restore()
  logger.restore()
})

afterEach(() => {
  document.body.textContent = ''
  noodluidom.reset()
})
