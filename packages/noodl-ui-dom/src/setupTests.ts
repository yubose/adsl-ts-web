import { Resolver } from 'noodl-ui'
import Logger from 'logsnap'
import {
  assetsUrl,
  noodlui,
  noodluidom,
  getAllResolvers,
  viewport,
} from './test-utils'

// let logSpy: sinon.SinonStub

const page = 'GeneralInfo'
const root = {
  GeneralInfo: {
    Radio: [{ key: 'Gender', value: '' }],
  },
}

before(() => {
  console.clear()
  Logger.disable()

  noodlui
    .init({ _log: false, viewport })
    .setPage(page)
    .use({
      getAssetsUrl: () => assetsUrl,
      getRoot: () => root,
    })
  // .use(
  //   Object.entries({ redraw: builtIns.redraw }).map(([funcName, fn]) => ({
  //     funcName,
  //     fn,
  //   })),
  // )

  // logSpy = sinon.stub(global.console, 'log').callsFake(() => _.noop)

  try {
    Object.defineProperty(noodlui, 'cleanup', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function _cleanup() {
        noodlui.reset({ keepCallbacks: true }).setPage(page)
      },
    })
  } catch (error) {
    throw new Error(error)
  }
  getAllResolvers().forEach((r) => {
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
  document.head.textContent = ''
  document.body.textContent = ''
  // @ts-expect-error
  noodlui.cleanup()
  noodluidom.reset()
})
