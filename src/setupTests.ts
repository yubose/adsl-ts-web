import noop from 'lodash/noop'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import { eventId } from 'noodl-ui-dom'
import { publish, Resolver } from 'noodl-ui'
import { assetsUrl, noodlui, ndom, viewport } from './utils/test-utils'

chai.use(sinonChai)

let logSpy: sinon.SinonStub
let root = { GeneralInfo: { Radio: [{ key: 'Gender', value: '' }] } }

before(() => {
  console.clear()
  noodlui.init({ _log: false })
  // @ts-expect-error
  delete window.location
  // @ts-expect-error
  window.location = {}

  logSpy = sinon.stub(global.console, 'log').callsFake(() => noop)

  ndom
    .on(eventId.redraw.ON_BEFORE_CLEANUP, (node, component) => {
      noodlui.componentCache().remove(component)
      publish(component, (c) => {
        noodlui.componentCache().remove(c)
      })
    })
    .use(noodlui)

  viewport.width = 375
  viewport.height = 667
})

after(() => {
  logSpy?.restore?.()
})

beforeEach(() => {
  noodlui.setPage('GeneralInfo').use({
    getAssetsUrl: () => assetsUrl,
    getBaseUrl: () => 'https://google.com/',
    getRoot: () => root,
  })
})

afterEach(() => {
  document.head.textContent = ''
  document.body.textContent = ''
  // Resets plugins, registry, noodlui.page
  noodlui.reset({ keepCallbacks: false })
})
