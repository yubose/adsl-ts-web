import curry from 'lodash/curry'
import * as t from './workerTypes'

const log = console.log
const tag = `[NoodlWorker]`

const NoodlWorker = (function () {
  let _state: t.Bg.State = {
    configKey: '',
    configVersion: '',
    pages: {},
  }
  let _worker: Worker | undefined

  const api = {
    _worker,
    command: curry(command),
  }

  function command<
    CmdName extends string,
    O extends t.Bg.MessageOptions['options'],
  >(name: CmdName, options?: O) {
    _worker?.postMessage({ command: name, options })
  }

  type NoodlWorkerApi = typeof api & {
    _worker: Worker
  }

  function createNoodlWorker(options: {
    url?: string
    options?: WorkerOptions
  }): NoodlWorkerApi

  function createNoodlWorker(worker: Worker): NoodlWorkerApi

  function createNoodlWorker(
    options: Worker | { url?: string; options?: WorkerOptions },
  ) {
    if ('postMessage' in options) {
      _worker = options
    } else {
      if (!options.url) {
        throw new Error(`url is required when instantiating a NoodlWorker`)
      }
      _worker = new Worker(options.url, options.options)
    }

    return api
  }

  return curry(createNoodlWorker)
})()

export default NoodlWorker
