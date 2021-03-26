import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { assetsUrl } from './utils/test-utils'
import NUI from './noodl-ui'

chai.use(sinonChai)
chai.use(chaiAsPromised)

let logSpy: sinon.SinonStub
let invariantStub: sinon.SinonStub

let defaultPage = 'Hello'
let defaultPageObject = { formData: { password: 'abc123' } }
let defaultRoot = { [defaultPage]: defaultPageObject }

before(() => {
  console.clear()
})

beforeEach(() => {
  logSpy = sinon.stub(global.console, 'log').callsFake(() => () => {})
  invariantStub = sinon.stub(global.console, 'error').callsFake(() => () => {})

  NUI.createPage({ name: defaultPage, viewport: { width: 375, height: 667 } })
  NUI.use({
    getAssetsUrl: () => assetsUrl,
    getBaseUrl: () => 'https://google.com/',
    getRoot: () => ({ ...defaultRoot }),
    getPreloadPages: () => [],
    getPages: () => [defaultPage],
  })
})

afterEach(() => {
  document.body.textContent = ''
  NUI.reset()
  invariantStub.restore()
  logSpy.restore?.()
})
