import jsdom from 'jsdom-global'
jsdom('', {
  resources: 'usable',
  runScripts: 'dangerously',
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
})
import MutationObserver from 'mutation-observer'
import noop from 'lodash/noop'
import chai from 'chai'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)

// let logStub: sinon.SinonStub

before(function () {
  global.MutationObserver = MutationObserver
  global.localStorage = window.localStorage
  // logStub = sinon.stub(global.console, 'log').callsFake(() => noop)
})

afterEach(() => {
  // let app = getMostRecentApp()
  // if (app) {
  //   app.reset()
  // } else ndom.reset()
  document.head.textContent = ''
  document.body.textContent = ''
})

after(() => {
  // logStub.restore()
})
