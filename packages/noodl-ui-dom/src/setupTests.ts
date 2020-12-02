import _ from 'lodash'
import sinon from 'sinon'
import { Resolver } from 'noodl-ui'
import {
  assetsUrl,
  noodlui,
  noodluidom,
  getAllResolvers,
  viewport,
} from './test-utils'

let logSpy: sinon.SinonStub

const page = 'GeneralInfo'
const root = {
  GeneralInfo: {
    Radio: [{ key: 'Gender', value: '' }],
  },
}

before(() => {
  console.clear()

  noodlui
    .init({ _log: false, viewport })
    .setPage(page)
    .use({
      getAssetsUrl: () => assetsUrl,
      getRoot: () => root,
    })

  // logSpy = sinon.stub(global.console, 'log').callsFake(() => _.noop)

  try {
    Object.defineProperty(noodlui, 'cleanup', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function _cleanup() {
        noodlui.reset({ keepCallbacks: false }).setPage(page)
      },
    })
  } catch (error) {
    throw new Error(error)
  }
  _.forEach(getAllResolvers(), (r) => {
    const resolver = new Resolver()
    resolver.setResolver(r)
    noodlui.use(resolver as Resolver)
  })
})

after(() => {
  // logSpy.restore()
})

beforeEach(() => {
  // noodlui.init({ _log: false, viewport })
  noodlui.setPage(page)
})

afterEach(() => {
  document.body.textContent = ''
  // @ts-expect-error
  noodlui.cleanup()
  noodluidom.removeAllCbs()
})
