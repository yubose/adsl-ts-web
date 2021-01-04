import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import Resolver from './Resolver'
import {
  assetsUrl,
  getAllResolvers,
  noodlui,
  viewport,
} from './utils/test-utils'

chai.use(sinonChai)

let logSpy: sinon.SinonStub

before(async () => {
  console.clear()
  noodlui.init({ _log: false })
  noodlui.use(viewport)

  viewport.width = 365
  viewport.height = 667

  try {
    logSpy = sinon.stub(global.console, 'log').callsFake(() => () => {})
  } catch (error) {
    throw new Error(error.message)
  }
})

beforeEach(() => {
  getAllResolvers().forEach((r) => {
    const resolver = new Resolver().setResolver(r)
    noodlui.use(resolver)
  })
  noodlui.use({
    getAssetsUrl: () => assetsUrl,
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
