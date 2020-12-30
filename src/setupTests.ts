import noop from 'lodash/noop'
import chai from 'chai'
import chaiDOM from 'chai-dom'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import { Resolver } from 'noodl-ui'
import Logger, { _color } from 'logsnap'
import {
  assetsUrl,
  getAllResolvers,
  noodlui,
  noodluidom,
  page,
  viewport,
} from './utils/test-utils'

chai.use(chaiDOM)
chai.use(sinonChai)

let logSpy: sinon.SinonStub

before(() => {
  noodlui.init({ _log: false })
  console.clear()
  Logger.disable()
  // @ts-expect-error
  delete window.location
  // @ts-expect-error
  window.location = {}

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
          .setViewport(viewport)
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
  document.body.appendChild(page.rootNode as HTMLElement)
})

afterEach(() => {
  document.body.textContent = ''
  // @ts-expect-error
  noodlui.cleanup()
  noodluidom.reset()
})
