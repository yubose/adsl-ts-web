import _ from 'lodash'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import { IResolver, Resolver, Viewport } from 'noodl-ui'
import Logger, { _color } from 'logsnap'
import noodlui from './app/noodl-ui'
import { assetsUrl, getAllResolvers, page } from './utils/test-utils'
import './handlers/dom'

chai.use(chaiAsPromised)

let logSpy: sinon.SinonStub
let eventTargetSpy: sinon.SinonStub
// let logsnapSpy: sinon.SinonStub

before(async () => {
  console.clear()
  Logger.disable()
  page.initializeRootNode()
  // Silence all the logging from our custom logger
  // Logger.create = sinon.stub().callsFake(() =>
  //   _.reduce(
  //     _.keys(_color),
  //     (acc: any, color) => {
  //       acc[color] = _.noop
  //       return acc
  //     },
  //     {},
  //   ),
  // )
  try {
    logSpy = sinon.stub(global.console, 'log').callsFake(() => _.noop)
    eventTargetSpy = sinon.stub(global, 'EventTarget')
    Logger.create = () =>
      // @ts-expect-error
      Object.assign(
        {
          func() {
            return this
          },
          log() {
            return this
          },
        },
        _.reduce(
          _.keys(_color),
          (acc, key) => _.assign(acc, { [key]: _.noop }),
          {},
        ),
      )

    Object.defineProperty(noodlui, 'cleanup', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: function _cleanup() {
        noodlui
          .reset()
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
    // logsnapSpy = sinon.stub(Logger, 'create').callsFake(() => {})
  } catch (error) {}
})

after(() => {
  logSpy?.restore?.()
  eventTargetSpy?.restore?.()
  // logsnapSpy?.reset()
})

beforeEach(() => {
  // @ts-expect-error
  noodlui.cleanup()
})

afterEach(() => {
  document.body.textContent = ''
  document.body.appendChild(page.rootNode as HTMLElement)
})
