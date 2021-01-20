import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { getAllResolversAsMap, Resolver, publish } from 'noodl-ui'
import { eventId } from './constants'
import { assetsUrl, noodlui, noodluidom, viewport } from './test-utils'

chai.use(sinonChai)

let logSpy: sinon.SinonStub

const page = 'GeneralInfo'
const root = { GeneralInfo: { Radio: [{ key: 'Gender', value: '' }] } }

before(() => {
  console.clear()
  noodlui.init({ _log: false })
  noodluidom
    .on(eventId.redraw.ON_BEFORE_CLEANUP, (node, component) => {
      noodlui.componentCache().remove(component)
      publish(component, (c) => {
        noodlui.componentCache().remove(c)
      })
    })
    .use(noodlui)

  viewport.width = 375
  viewport.height = 667

  logSpy = sinon.stub(global.console, 'log').callsFake(() => () => {})

  Object.entries(getAllResolversAsMap()).forEach(([name, r]) => {
    noodlui.use({ name, resolver: new Resolver().setResolver(r) } as any)
  })
})

after(() => {
  logSpy.restore()
})

beforeEach(() => {
  noodlui.setPage(page).use({
    getAssetsUrl: () => assetsUrl,
    getBaseUrl: () => 'https://google.com/',
    getRoot: () => root,
  })
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  // Resets plugins, registry, noodlui.page
  noodlui.reset()
})
