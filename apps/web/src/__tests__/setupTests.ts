import axios from 'axios'
import httpAdapter from 'axios/lib/adapters/http'
import JSDOM from 'jsdom-global'
import log from 'loglevel'
import nock from 'nock'
JSDOM('', {
  resources: 'usable',
  runScripts: 'dangerously',
  url: 'http://127.0.0.1:3000',
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
import { nui, ndom } from './test-utils'
import { clearInstance } from '../app/noodl'

chai.use(chaiAsPromised)
chai.use(sinonChai)
log.setLevel('debug')

before(() => {
  process.stdout.write('\x1Bc')
  global.MutationObserver = require('mutation-observer')
  axios.defaults.adapter = httpAdapter
})

afterEach(() => {
  clearInstance()
  document.head.textContent = ''
  document.body.textContent = ''
  nui.reset()
  ndom.reset()
  nock.cleanAll()
})
