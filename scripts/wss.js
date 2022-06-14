const chalk = require('chalk')
const ws = require('ws')
const u = require('@jsmanifest/utils')

/**
 * @typedef CallbackFnArgs
 * @property { string } CallbackFnArgs.type
 * @property { boolean } CallbackFnArgs.isFile
 * @property { boolean } CallbackFnArgs.isDirectory
 * @property { string } CallbackFnArgs.name
 * @property { string } CallbackFnArgs.path
 */

/**
 * @typedef CallbackFn
 * @type { (args: CallbackFnArgs) => void }
 */

/**
 * @typedef On
 * @type { object }
 * @property { (watcher: chokidar.FSWatcher, watchedFiles: { dir: { files: string[] }}, watchCount: number) => void } [On.ready]
 * @property { CallbackFn } [On.add]
 * @property { CallbackFn } [On.addDir]
 * @property { CallbackFn } [On.change]
 * @property { (args: { type: string; error: Error }) => void } [On.error]
 * @property { CallbackFn } [On.unlink]
 * @property { CallbackFn } [On.unlinkDir]
 */

const log = console.log
const tag = `[${u.cyan('wss')}]`
const rtag = `[${chalk.keyword('aquamarine')('wss-req')}]`
const stag = `[${chalk.keyword('navajowhite')('wss-socket')}]`

/**
 * @param { object } args
 * @param { On } args.on
 * @param { string } args.host
 * @param { number } args.port
 * @param { (error: Error) => any } args.serializeError
 */
function createWss({
  host = '127.0.0.1',
  on: onProp,
  port,
  serializeError,
  ...rest
}) {
  /** @type { ws.WebSocket } */
  let wssServer

  let hooks = {
    open: [],
    close: [],
    error: [],
    unexpectedResponse: [],
    message: [],
  }

  /**
   * @param {{ type: string; } & Record<string, any> } message
   */
  function emit(message) {
    const type = message?.type
    wssServer.clients.forEach((client) => {
      client.send(JSON.stringify(message, null, 2), async function onSend(err) {
        if (err) {
          log(`${tag} ${u.yellow('Error')}`, serializeError(err))
          if (hooks.error.length) {
            await Promise.all(hooks.map((fn) => fn({ type, error: err })))
          }
        } else if (u.isArr(hooks[type]) && hooks[type].length) {
          await Promise.all(hooks[type].map((fn) => fn(message)))
        }
      })
    })
  }

  wssServer = new ws.WebSocketServer({ port, host, ...rest })

  wssServer
    .on('connection', (s, req) => {
      log(`${tag} Connected`)
      socket = s

      const wrapOrDefault = (fn, def) => fn || def

      req.on('data', (chunk) => log(`${rtag} Data ${chunk.toString()}`))
      req.on('close', () => log(`${rtag} Closed`))
      req.on('end', () => log(`${rtag} Ended`))
      req.on('pause', () => log(`${rtag} Pauseeed`))
      req.on('resume', () => log(`${rtag} Resumed`))
      req.on('readable', () => log(`${rtag} Readable`))

      socket.on(
        'open',
        wrapOrDefault(onProp?.open, () => log(`${stag} Opened`)),
      )

      socket.on(
        'close',
        wrapOrDefault(onProp?.close, () => log(`${stag} Closed`)),
      )

      socket.on(
        'error',
        wrapOrDefault(onProp?.error, (err) =>
          log(`${stag} Error`, serializeError(err)),
        ),
      )

      socket.on('unexpected-response', (err) =>
        wrapOrDefault(onProp?.unexpectedResponse, () =>
          log(`${stag} ${u.red('Unexpected response')}`, serializeError(err)),
        ),
      )

      socket.on(
        'message',
        wrapOrDefault(onProp?.message, async function onMessage(chunk) {
          const data = JSON.parse(u.isStr(chunk) ? chunk : chunk.toString())
          log(`${stag} Message`, data)
        }),
      )
    })
    .on('listening', () => log(`${tag} Listening`))
    .on('close', () => log(`${tag} Closed`))
    .on('error', (err) => console.error(`${tag} Error`, serializeError(err)))

  function on(type, fn) {
    hooks[type]?.push?.(fn)
    return this
  }

  if (onProp) {
    u.entries(onProp).forEach(([key, fn]) => hooks[key]?.push(fn))
  }

  return {
    emit,
    get on() {
      return on.bind(this)
    },
    server: wssServer,
    tag: {
      wss: tag,
      request: rtag,
      server: stag,
    },
  }
}

module.exports = createWss
