import sinon from 'sinon'
import { getAllResolvers, Resolver, publish } from 'noodl-ui'
import { eventId } from './constants'
import { assetsUrl, noodlui, noodluidom, viewport } from './test-utils'

let logSpy: sinon.SinonStub

const page = 'GeneralInfo'
const root = { GeneralInfo: { Radio: [{ key: 'Gender', value: '' }] } }

before(() => {
  console.clear()
  noodlui.init({ _log: false })
  noodluidom
    .configure({
      redraw: {
        resolveComponents: noodlui.resolveComponents.bind(noodlui),
      },
    })
    .on(eventId.redraw.ON_BEFORE_CLEANUP, (node, component) => {
      noodlui.componentCache().remove(component)
      publish(component, (c) => {
        noodlui.componentCache().remove(c)
      })
    })
    .register(noodlui)

  viewport.width = 365
  viewport.height = 667

  logSpy = sinon.stub(global.console, 'log').callsFake(() => () => {})

  getAllResolvers().forEach((r) => {
    const resolver = new Resolver().setResolver(r)
    noodlui.use(resolver)
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
  // Resets plugins, registry, noodlui.page
  noodlui.reset()
})
