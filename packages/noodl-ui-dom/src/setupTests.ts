import _ from 'lodash'
import { IResolver, Resolver, Viewport } from 'noodl-ui'
import {
  assetsUrl,
  noodlui,
  noodluidom,
  getAllResolvers,
  viewport,
} from './test-utils'

// let logSpy: sinon.SinonStub

before(() => {
  console.clear()
  const page = 'GeneralInfo'
  const root = {
    GeneralInfo: {
      Radio: [{ key: 'Gender', value: '' }],
    },
  }
  noodlui
    .init({ _log: false, viewport })
    .setAssetsUrl(assetsUrl)
    .setRoot(page, root)
    .setPage(page)
  // logSpy = sinon.stub(global.console, 'log').callsFake(() => _.noop)

  try {
    Object.defineProperty(noodlui, 'cleanup', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function _cleanup() {
        noodlui
          .reset({ keepCallbacks: true })
          .setAssetsUrl(assetsUrl)
          .setRoot(page, root)
          .setPage(page)
      },
    })
  } catch (error) {
    throw new Error(error)
  }
  _.forEach(getAllResolvers(), (r) => {
    const resolver = new Resolver()
    resolver.setResolver(r)
    noodlui.use(resolver as IResolver)
  })
})

afterEach(() => {
  document.body.textContent = ''
  // @ts-expect-error
  noodlui.cleanup()
  noodluidom.removeAllCbs()
})
