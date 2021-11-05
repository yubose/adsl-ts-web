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

  function command<
    CmdName extends string,
    O extends t.Bg.MessageOptions['options'],
  >(name: CmdName, options?: O) {
    _worker?.postMessage({ command: name, options })
  }

  type NoodlWorkerApi = typeof o & {
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

    return {
      _worker,
      command: curry(command),
    }
  }

  return curry(createNoodlWorker)
})()

export default NoodlWorker
