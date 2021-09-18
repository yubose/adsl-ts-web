import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chai from 'chai'
import { assetsUrl, baseUrl, getPresetPageObjects } from './utils/test-utils'
import nui from './noodl-ui'
import type NuiPage from './Page'
import * as c from './constants'

chai.use(sinonChai)

let logSpy: sinon.SinonStub
let invariantStub: sinon.SinonStub

before(() => {
  console.clear()
  logSpy = sinon.stub(global.console, 'log').callsFake(() => () => {})
  invariantStub = sinon.stub(global.console, 'error').callsFake(() => () => {})
})

beforeEach(() => {
  const root = getPresetPageObjects()
  nui.createPage({ name: 'Hello', viewport: { width: 375, height: 667 } })
  nui.use({
    getAssetsUrl: () => assetsUrl,
    getBaseUrl: () => baseUrl,
    getPages: () => Object.keys(root),
    getRoot: () => root,
    transaction: {
      [c.nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async (page: NuiPage) =>
        root[page.page],
    },
  })
})

afterEach(() => {
  document.body.textContent = ''
  nui.reset()
})

after(() => {
  invariantStub.restore()
  logSpy.restore?.()
})
