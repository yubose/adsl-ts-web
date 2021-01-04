import noop from 'lodash/noop'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import { getAllResolvers, Resolver } from 'noodl-ui'
import {
  assetsUrl,
  noodlui,
  noodluidom,
  page,
  viewport,
} from './utils/test-utils'

chai.use(sinonChai)

let logSpy: sinon.SinonStub

before(() => {
  noodlui.init({ _log: false })
  console.clear()
  // @ts-expect-error
  delete window.location
  // @ts-expect-error
  window.location = {}

  logSpy = sinon.stub(global.console, 'log').callsFake(() => noop)

  getAllResolvers().forEach((r) => {
    const resolver = new Resolver().setResolver(r)
    noodlui.use(resolver)
  })
})

after(() => {
  logSpy?.restore?.()
})

beforeEach(() => {
  document.body.appendChild(page.rootNode as HTMLElement)
})

afterEach(() => {
  document.body.textContent = ''
  noodlui
    .setPage('MeetingLobby')
    .reset({ keepCallbacks: true })
    .use(viewport)
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
  noodluidom.reset()
})
