import jsdom from 'jsdom-global'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'
jsdom('', {
  resources: 'usable',
  runScripts: 'dangerously',
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  beforeParse(win) {
    global.EventTarget = win.EventTarget
    global.localStorage = win.localStorage
  },
})

chai.use(chaiAsPromised)
chai.use(sinonChai)

before(() => {
  global.MutationObserver = require('mutation-observer')
})

afterEach(() => {
  // let app = getMostRecentApp()
  // if (app) {
  //   app.reset()
  // } else ndom.reset()
  document.head.textContent = ''
  document.body.textContent = ''
})
