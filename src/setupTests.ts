import _ from 'lodash'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import { isEmitObj } from 'noodl-utils'
import { IResolver, Resolver, Viewport } from 'noodl-ui'
import Logger, { _color } from 'logsnap'
import createActions from './handlers/actions'
import {
  assetsUrl,
  getAllResolvers,
  noodl,
  noodlui,
  page,
} from './utils/test-utils'
import './handlers/dom'

chai.use(chaiAsPromised)

let logSpy: sinon.SinonStub

before(() => {
  // noodlui.init()
  console.clear()
  Logger.disable()

  const actions = createActions({ page })

  try {
    logSpy = sinon.stub(global.console, 'log').callsFake(() => _.noop)

    Object.defineProperty(noodlui, 'cleanup', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: function _cleanup() {
        noodlui
          .reset({ keepCallbacks: true })
          .setAssetsUrl(assetsUrl)
          .setPage('MeetingLobby')
          .setViewport(new Viewport())
          .setRoot({
            MeetingLobby: {
              module: 'meetingroom',
              title: 'Meeting Lobby',
              formData: { phoneNumber: '', password: '', code: '' },
            },
          })
      },
    })

    _.forEach(getAllResolvers(), (r) => {
      const resolver = new Resolver()
      resolver.setResolver(r)
      noodlui.use(resolver as IResolver)
    })

    noodlui.use(
      _.reduce(
        _.entries(actions),
        (arr, [actionType, actions]) =>
          arr.concat(
            actions.map((a) => ({
              actionType,
              ...a,
              ...(isEmitObj(a) ? { context: { noodl, noodlui } } : undefined),
            })),
          ),
        [] as any[],
      ),
    )
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
})
