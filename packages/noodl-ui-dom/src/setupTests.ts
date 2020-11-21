import _ from 'lodash'
import sinon from 'sinon'
import Logger from 'logsnap'
import { IResolver, Resolver, Viewport } from 'noodl-ui'
import { assetsUrl, noodlui, getAllResolvers } from './test-utils'
// import { noodlui } from '../../../src/utils/test-utils'

let logSpy: sinon.SinonStub

before(() => {
  noodlui.init()
  console.clear()

  Logger.disable()
  logSpy = sinon.stub(global.console, 'log').callsFake(() => _.noop)

  try {
    logSpy = sinon.stub(global.console, 'log').callsFake(() => _.noop)

    Object.defineProperty(noodlui, 'cleanup', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: function _cleanup() {
        noodlui
          .reset()
          .setAssetsUrl(assetsUrl)
          .setPage('GeneralInfo')
          .setViewport(new Viewport())
          .setRoot({
            GeneralInfo: {
              Radio: [{ key: 'Gender', value: '' }],
            },
          })
      },
    })

    _.forEach(getAllResolvers(), (r) => {
      const resolver = new Resolver()
      resolver.setResolver(r)
      noodlui.use(resolver as IResolver)
    })
  } catch (error) {}
})

beforeEach(() => {
  // listenToDOM()
})

after(() => {
  logSpy?.restore?.()
  console.info('ELLOE??')
})

afterEach(() => {
  document.body.textContent = ''
  noodlui.reset()
})
