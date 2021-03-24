import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { NOODLUI as NUI, publish } from 'noodl-ui'
import { eventId } from './constants'
import { assetsUrl, baseUrl, ndom, viewport } from './test-utils'

chai.use(sinonChai)

let logSpy: sinon.SinonStub

const defaultPageName = 'GeneralInfo'
const root = { GeneralInfo: { Radio: [{ key: 'Gender', value: '' }] } }

before(() => {
  console.clear()

  viewport.width = 375
  viewport.height = 667

  logSpy = sinon.stub(global.console, 'log').callsFake(() => () => {})
})

after(() => {
  logSpy.restore()
})

beforeEach(() => {
  ndom.createPage(defaultPageName)
  ndom.page.on(eventId.page.on.ON_REDRAW_BEFORE_CLEANUP, (node, component) => {
    NUI.cache.component.remove(component)
    publish(component, (c) => NUI.cache.component.remove(c))
  })
  NUI.use({
    getAssetsUrl: () => assetsUrl,
    getBaseUrl: () => baseUrl,
    getRoot: () => root,
    getPages: () => [defaultPageName],
    getPreloadPages: () => [],
  })
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  ndom.reset()
})
