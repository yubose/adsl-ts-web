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

  function command<CmdName extends string, O = any>(
    name: CmdName,
    options?: O,
  ) {
    _worker?.postMessage({ command: name, options })
  }

  function message({ options }: t.Bg.MessageOptions) {
    _worker?.postMessage(options)
  }

  const o = {
    command: curry<string, t.Fg.MessageCommand<t.Bg.CommandName>['options']>(
      command,
    ),
    message: curry(message),
  }

  return curry(
    (
      url: string,
      options: WorkerOptions,
      callback: (this: Worker, api: typeof o) => any,
    ) => {
      _worker = new Worker(url, options)
      callback?.call(_worker, o)
      return _worker
    },
  )
})()

export default NoodlWorker
