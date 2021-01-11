import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import getAllResolvers from './utils/getAllResolvers'
import Resolver from './Resolver'
import { assetsUrl, noodlui, viewport } from './utils/test-utils'

chai.use(sinonChai)

let logSpy: sinon.SinonStub

const resolvers = getAllResolvers().map((r) => new Resolver().setResolver(r))

before(() => {
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
  resolvers.forEach((r) => noodlui.use(r))
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
