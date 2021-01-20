import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { getAllResolversAsMap } from './utils/getAllResolvers'
import Resolver from './Resolver'
import { assetsUrl, noodlui, viewport } from './utils/test-utils'
import getStore from './store'

chai.use(sinonChai)

let logSpy: sinon.SinonStub

before(() => {
  console.clear()
  noodlui.init({ _log: false })
  noodlui.use(viewport)

  try {
    logSpy = sinon.stub(global.console, 'log').callsFake(() => () => {})
  } catch (error) {
    throw new Error(error.message)
  }
})

beforeEach(() => {
  Object.entries(getAllResolversAsMap()).forEach(([name, resolver]) => {
    const r = new Resolver().setResolver(resolver)
    noodlui.use(r)
    noodlui.use({ name, resolver: r })
    getStore().use({ name, resolver: r })
  })
  noodlui.viewport.width = 375
  noodlui.viewport.height = 667
  noodlui.use({
    getAssetsUrl: () => assetsUrl,
    getBaseUrl: () => 'https://google.com/',
    getRoot: () => ({}),
  })
})

after(() => {
  logSpy?.restore?.()
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  // Resets plugins, registry and noodlui.page
  noodlui.reset()
})
