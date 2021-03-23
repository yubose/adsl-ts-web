import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { NOODLUI as NUI, publish } from 'noodl-ui'
import { eventId } from './constants'
import { assetsUrl, ndom, viewport } from './test-utils'

chai.use(sinonChai)

let logSpy: sinon.SinonStub

const page = 'GeneralInfo'
const root = { GeneralInfo: { Radio: [{ key: 'Gender', value: '' }] } }

before(() => {
  console.clear()
  ndom.page.on(eventId.page.on.ON_REDRAW_BEFORE_CLEANUP, (node, component) => {
    NUI.cache.component.remove(component)
    publish(component, (c) => {
      NUI.cache.component.remove(c)
    })
  })
  ndom.use(NUI)

  viewport.width = 375
  viewport.height = 667

  logSpy = sinon.stub(global.console, 'log').callsFake(() => () => {})
})

after(() => {
  logSpy.restore()
})

beforeEach(() => {
  NUI.getRootPage().page = page
  NUI.use({
    getAssetsUrl: () => assetsUrl,
    getBaseUrl: () => 'https://google.com/',
    getRoot: () => root,
    getPages: () => [page],
    getPreloadPages: () => [],
  })
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  ndom.reset()
})
