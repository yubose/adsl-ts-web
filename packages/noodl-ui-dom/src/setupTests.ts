import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { Resolver, NOODLUI as NUI, publish, resolveStyles } from 'noodl-ui'
import { eventId } from './constants'
import { assetsUrl, noodlui, ndom, viewport } from './test-utils'

chai.use(sinonChai)

let logSpy: sinon.SinonStub

const page = 'GeneralInfo'
const rooft = { GeneralInfo: { Radio: [{ key: 'Gender', value: '' }] } }

before(() => {
  console.clear()
  noodlui.init({ _log: false })
  ndom.page.on(eventId.page.on.ON_REDRAW_BEFORE_CLEANUP, (node, component) => {
    noodlui.cache.component.remove(component)
    publish(component, (c) => {
      NUI.cache.component.remove(c)
    })
  })
  ndom.use(noodlui)

  viewport.width = 375
  viewport.height = 667

  logSpy = sinon.stub(global.console, 'log').callsFake(() => () => {})
})

after(() => {
  logSpy.restore()
})

beforeEach(() => {
  noodlui
    .setPage(page)
    .use(viewport)
    .use({
      getAssetsUrl: () => assetsUrl,
      getBaseUrl: () => 'https://google.com/',
      getRoot: () => root,
    })
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  noodlui.reset()
  ndom.reset()
})
