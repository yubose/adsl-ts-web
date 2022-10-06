import JSDOM from 'jsdom-global'
import log from 'loglevel'
JSDOM('', {
  resources: 'usable',
  runScripts: 'dangerously',
  url: 'http://localhost:3000',
  beforeParse(win) {
    // @ts-expect-error
    global.window = win
    window.addEventListener = win.addEventListener.bind(win)
    window.removeEventListener = win.removeEventListener.bind(win)
    global.EventTarget = win.EventTarget
    global.localStorage = win.localStorage
    localStorage = win.localStorage
    // @ts-expect-error
    win.HTMLCanvasElement.prototype.getContext = () => {}
  },
})
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'

chai.use(chaiAsPromised)
chai.use(sinonChai)
log.setLevel('error')

before(() => {
  process.stdout.write('\x1Bc')
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
