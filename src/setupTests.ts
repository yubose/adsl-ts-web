import noop from 'lodash/noop'
import chai from 'chai'
import chaiDOM from 'chai-dom'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import { Resolver, Viewport } from 'noodl-ui'
import Logger, { _color } from 'logsnap'
import {
  assetsUrl,
  getAllResolvers,
  noodlui,
  noodluidom,
  page,
} from './utils/test-utils'

chai.use(chaiDOM)
chai.use(sinonChai)

let logSpy: sinon.SinonStub

before(() => {
  noodlui.init({ _log: false })
  console.clear()
  Logger.disable()

  try {
    logSpy = sinon.stub(global.console, 'log').callsFake(() => noop)

    Object.defineProperty(noodlui, 'cleanup', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: function _cleanup() {
        noodlui
          .reset({ keepCallbacks: true })
          .use({
            getAssetsUrl: () => assetsUrl,
            getRoot: () => ({
              MeetingLobby: {
                module: 'meetingroom',
                title: 'Meeting Lobby',
                formData: { phoneNumber: '', password: '', code: '' },
              },
            }),
          })
          .setPage('MeetingLobby')
          .setViewport(new Viewport())
      },
    })

    getAllResolvers().forEach((r) => {
      const resolver = new Resolver()
      resolver.setResolver(r)
      noodlui.use(resolver as Resolver)
    })
  } catch (error) {
    throw new Error(error)
  }
})

after(() => {
  logSpy?.restore?.()
})

beforeEach(() => {
  page.initializeRootNode()
  document.body.appendChild(page.rootNode as HTMLElement)
})

afterEach(() => {
  document.body.textContent = ''
  page.rootNode = null
  // @ts-expect-error
  noodlui.cleanup()
  noodluidom.reset()
})
