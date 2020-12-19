import { Resolver } from 'noodl-ui'
import sinon from 'sinon'
import Logger from 'logsnap'
import { assetsUrl, getAllResolvers, noodlui, noodluidom } from './test-utils'

let logSpy: sinon.SinonStub

const page = 'GeneralInfo'
const root = { GeneralInfo: { Radio: [{ key: 'Gender', value: '' }] } }

before(() => {
  console.clear()
  Logger.disable()
  noodluidom.register(noodlui)

  logSpy = sinon.stub(global.console, 'log').callsFake(() => () => {})

  getAllResolvers().forEach((r) => {
    const resolver = new Resolver()
    resolver.setResolver(r)
    noodlui.use(resolver as Resolver)
  })
})

after(() => {
  logSpy.restore()
})

beforeEach(() => {
  noodlui.setPage(page).use({
    getAssetsUrl: () => assetsUrl,
    getRoot: () => root,
  })
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  noodlui.reset()
})
