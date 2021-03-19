import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import {
  getAllResolversAsMap,
  Resolver,
  publish,
  resolveStyles,
} from 'noodl-ui'
import { eventId } from './constants'
import { assetsUrl, noodlui, ndom, viewport } from './test-utils'

chai.use(sinonChai)

let logSpy: sinon.SinonStub

const page = 'GeneralInfo'
const root = { GeneralInfo: { Radio: [{ key: 'Gender', value: '' }] } }

before(() => {
  console.clear()
  noodlui.init({ _log: false })
  ndom.page.on(eventId.page.on.ON_REDRAW_BEFORE_CLEANUP, (node, component) => {
    noodlui.componentCache().remove(component)
    publish(component, (c) => {
      noodlui.componentCache().remove(c)
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

  Object.entries(getAllResolversAsMap()).forEach(([name, resolver]) => {
    if (
      !/(getAlign|getPosition|getBorder|getColors|getFont|getPosition|getSizes|getStylesBy|getTransformedStyle)/i.test(
        name,
      )
    ) {
      const r = new Resolver().setResolver(resolver)
      noodlui.use({ name, resolver: r })
    }
  })

  noodlui.use({
    name: 'resolveStyles',
    resolver: new Resolver().setResolver(resolveStyles),
  })
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  noodlui.reset()
  ndom.reset()
})
