import NoodlWorker from '../modules/NoodlWorker'
import * as t from '../modules/NoodlWorker/types'
import App from '../App'

function createNoodlWorker(app: App, path: string, options?: WorkerOptions) {
  const tag = `%c[NoodlWorker]`
  const style = `color:navajowhite;font-weight:400;`
  const log = console.log

  const _state: t.Bg.State = {
    configKey: '',
    configVersion: '',
    pages: {},
  }

  const noodlWorker = NoodlWorker(path, options || {}, function (api) {
    this.addEventListener('message', function (msg) {
      log(`${tag} Message`, style, msg.data)
    })

    this.addEventListener('messageerror', function (evt) {
      log(`${tag} Message error`, style, evt)
    })

    this.addEventListener('error', function (err) {
      log(`${tag} Error`, style, err)
    })
  })

  return {
    _worker: noodlWorker,
    get state() {
      return _state
    },
    addEventListener: noodlWorker.addEventListener.bind(noodlWorker),
    dispatchEvent: noodlWorker.dispatchEvent.bind(noodlWorker),
    postMessage: noodlWorker.postMessage.bind(noodlWorker),
    removeEventListener: noodlWorker.removeEventListener.bind(noodlWorker),
    terminate: noodlWorker.terminate.bind(noodlWorker),
  }
}

export default createNoodlWorker
