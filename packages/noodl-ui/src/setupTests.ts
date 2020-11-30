import _ from 'lodash'
import sinon from 'sinon'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import Logger, { _color } from 'logsnap'
import { assetsUrl, noodlui } from './utils/test-utils'

chai.use(chaiAsPromised)

let logSpy: sinon.SinonStub

before(async () => {
  console.clear()
  Logger.disable()
  try {
    logSpy = sinon.stub(global.console, 'log').callsFake(() => _.noop)
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
  // noodlui.cleanup()
})
