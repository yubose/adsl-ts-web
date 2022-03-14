import sinonChai from 'sinon-chai'
import chai from 'chai'
import { assetsUrl, baseUrl, getPresetPageObjects } from './utils/test-utils'
import nui from './noodl-ui'
import log from './utils/log'
import type NuiPage from './Page'
import * as c from './constants'

chai.use(sinonChai)

before(() => {
  console.clear()
  log.setLevel('error')
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
        nui.getRoot()[page.page],
    },
  })
})

afterEach(() => {
  document.body.textContent = ''
  nui.reset()
})
