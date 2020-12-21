import noop from 'lodash/noop'
import sinon from 'sinon'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiDOM from 'chai-dom'
import sinonChai from 'sinon-chai'
import Logger, { _color } from 'logsnap'
import { assetsUrl, noodlui } from './utils/test-utils'

chai.use(chaiAsPromised)
chai.use(chaiDOM)
chai.use(sinonChai)

let logSpy: sinon.SinonStub

before(async () => {
  console.clear()
  Logger.disable()
  try {
    logSpy = sinon.stub(global.console, 'log').callsFake(() => noop)
  } catch (error) {
    throw new Error(error.message)
  }
})

beforeEach(() => {
  noodlui
    .init({
      _log: false,
    })
    .use({
      getAssetsUrl: () => assetsUrl,
      getRoot: () => ({}),
    })
})

after(() => {
  logSpy?.restore?.()
})

afterEach(() => {
  document.body.textContent = ''
  noodlui.cleanup()
})
