const set = require('lodash/set')
const { execSync } = require('child_process')
const chalk = require('chalk')
const u = require('@jsmanifest/utils')
const nu = require('noodl-utils')
const {
  assertBuiltIn,
  assertGoto,
  assertPopUpView,
  assertRef,
  assertUtils,
  assertViewTag,
  DocRoot,
  DocDiagnostics,
  DocVisitor,
  getYamlNodeKind,
  toJson,
  toYml,
  unwrap,
} = require('noodl-yaml')
const y = require('yaml')
const path = require('path')
const fs = require('fs-extra')
const fg = require('fast-glob')
const chokidar = require('chokidar')
const ws = require('ws')

const { log } = console
const { blue, cyan, green, magenta, red, yellow } = u
const loadAsYml = (p) => fs.readFileSync(p, 'utf8')
const aqua = chalk.keyword('aquamarine')
const coolGold = chalk.keyword('navajowhite')
const serializeErr = (e) => ({
  code: e?.code,
  name: e?.name,
  message: e?.message,
})

const ADD_DIR = 'ADD_DIR'
const ADD_FILE = 'ADD_FILE'
const DIR_REMOVED = 'DIR_REMOVED'
const FILE_CHANGED = 'FILE_CHANGED'
const FILE_REMOVED = 'FILE_REMOVED'
const WATCH_ERROR = 'WATCH_ERROR'

const DEFAULT_BASE_DIR = __dirname
const RUN_DIAGNOSTICS = 'RUN_DIAGNOSTICS'

/**
 * @param { string } basedir
 * @param { import('webpack-dev-server/types/lib/Server') } devServer
 * @param { object } [opts]
 * @param {{ CONFIG: string }} [opts.env]
 * @param { ws.ServerOptions } [opts.wssOptions]
 * @param { import('chokidar').WatchOptions & { glob?: string } } [opts.watchOptions]
 */
function createAnalysisModule(basedir, devServer, opts = {}) {
  const {
    env = {},
    watchOptions = {},
    webpackConfig = {},
    wssOptions = {},
  } = opts
  const configKey = env.APP || env.CONFIG || 'testpage'
  const messages = []

  log(webpackConfig)

  /** @type chokidar.FSWatcher */
  let watcher

  /** @type ws.Server */
  let wss

  /** @type { ws.WebSocket } */
  let socket

  const appDir = path.join(basedir, 'app') // "./analysis/app"
  const testDir = path.join(basedir, configKey) // "./analysis/<configKey>"
  const watchGlobs = [path.join(basedir, '**/*')]

  {
    const pathToAnalysisDashboardFile = path.join(appDir, 'Dashboard_en.yml')

    if (fs.existsSync(pathToAnalysisDashboardFile)) {
      const yml = fs.readFileSync(pathToAnalysisDashboardFile, 'utf8')
      const json = toJson(yml)
      const configBefore = json.config
      set(json, 'Dashboard.config', configKey)
      fs.writeFileSync(pathToAnalysisDashboardFile, toYml(json), 'utf8')
      log(
        `${green(`Changed analysis Dashboard config from `)} to ` +
          `${cyan(configBefore)} to ${yellow(configKey)}`,
      )
    } else {
      throw new Error(
        `Missing analysis Dashboard ${pathToAnalysisDashboardFile}`,
      )
    }
  }

  const docDiagnostics = new DocDiagnostics()
  const docRoot = new DocRoot()
  const docVisitor = new DocVisitor()

  docDiagnostics.use(docRoot)
  docDiagnostics.use(docVisitor)

  function emit(message) {
    wss.clients.forEach((client) => {
      client.send(JSON.stringify(message, null, 2), function onSend(err) {
        if (err) log(`${tag} ${yellow('Error')}`, serializeErr(err))
      })
    })
  }

  async function runDiagnostics(data) {
    let { preload = [], pages = [], root: rootObject } = data

    /**
     * @param { 'preload' | 'page' } type
     */
    const load = async (type) => {
      let arr = type === 'page' ? pages : preload
      await Promise.all(
        arr.map(async (page) => {
          try {
            page = unwrap(page)
            docDiagnostics.mark(type, page)
            const doc = new y.Document(rootObject[page])
            if (type === 'preload') {
              if (y.isMap(doc.contents)) {
                doc.contents?.items.forEach((pair) => {
                  docRoot.set(pair.key, pair.value)
                })
              }
            } else {
              docRoot.set(page, doc)
            }
          } catch (error) {
            console.error(
              error instanceof Error ? error : new Error(String(error)),
            )
          }
        }),
      )
    }

    await Promise.all([load('preload'), load('page')])

    const diagnostics = docDiagnostics
      .run({
        asserters: [
          assertBuiltIn,
          assertRef,
          assertGoto,
          assertPopUpView,
          assertViewTag,
        ],
        // @ts-expect-error
        builtIn: {
          normalize: (dataIn, args) => {
            if (y.isNode(dataIn) || y.isPair(dataIn) || y.isDocument(dataIn)) {
              y.visit(dataIn, (k, n) => {
                return [
                  assertBuiltIn,
                  assertRef,
                  assertGoto,
                  assertPopUpView,
                  assertViewTag,
                ]
                  .find((f) => f.cond(getYamlNodeKind(n), n))
                  ?.fn?.({
                    ...args,
                    key: k,
                    node: n,
                  })
              })
            }
            return dataIn.toJSON()
          },
        },
      })
      .map((diagnostic) => diagnostic.toJSON())

    return diagnostics
  }

  function watch() {
    const tag = `[${blue('watch')}]`

    /**
     * @param { (args:{ isFile: boolean; isFolder: boolean; name: string; path: string }) => void } fn
     * @returns
     */
    function onWatchEvent(fn) {
      async function onEvent(filepath) {
        filepath = path.resolve(filepath)
        const stats = await fs.stat(filepath)
        const pathObject = path.parse(filepath)
        return fn({
          isFile: stats.isFile(),
          isFolder: stats.isDirectory(),
          name: pathObject.name,
          path: filepath,
        })
      }
      return onEvent
    }

    watcher = chokidar.watch(watchGlobs, {
      ignoreInitial: false,
      ignorePermissionErrors: true,
      ...watchOptions,
    })

    watcher
      .on('ready', () => {
        const watchedFiles = watcher?.getWatched()
        const watchCount = watchedFiles
          ? u
              .values(watchedFiles)
              .reduce((count, files) => (count += files.length || 0), 0)
          : 0
        log(`${tag} Watching ${yellow(watchCount)} files`)
      })
      .on(
        'add',
        onWatchEvent((args) => emit({ type: ADD_FILE, ...args })),
      )
      .on(
        'addDir',
        onWatchEvent((args) => emit({ type: ADD_DIR, ...args })),
      )
      .on(
        'change',
        onWatchEvent((args) => emit({ type: FILE_CHANGED, ...args })),
      )
      .on('error', (err) => emit({ type: WATCH_ERROR, ...serializeErr(err) }))
      .on('unlink', (filepath) => emit({ type: FILE_REMOVED, filepath }))
      .on('unlinkDir', (dir) => emit({ type: DIR_REMOVED, dir }))
  }

  /**
   * @param { ws.ServerOptions } opts
   */
  function listen(opts) {
    const tag = `[${u.cyan('wss')}]`
    wss = new ws.WebSocketServer({ port: 3020, host: '127.0.0.1', ...opts })
    wss
      .on('connection', (s, req) => {
        log(`${tag} Connected`)
        socket = s

        const reqTag = `[${chalk.keyword('aquamarine')('wss-req')}]`
        req.on('data', (chunk) => log(`${reqTag} Data ${chunk.toString()}`))
        req.on('close', () => log(`${reqTag} Closed`))
        req.on('end', () => log(`${reqTag} Ended`))
        req.on('pause', () => log(`${reqTag} Pauseeed`))
        req.on('resume', () => log(`${reqTag} Resumed`))
        req.on('readable', () => log(`${reqTag} Readable`))

        const stag = `[${chalk.keyword('navajowhite')('wss-socket')}]`
        socket.on('open', () => log(`${stag} Opened`))
        socket.on('close', () => log(`${stag} Closed`))
        socket.on('error', (err) => log(`${stag} Error`, serializeErr(err)))
        socket.on('unexpected-response', (err) =>
          log(`${stag} ${red('Unexpected response')}`, serializeErr(err)),
        )
        socket.on('message', async function onMessage(chunk) {
          const data = JSON.parse(u.isStr(chunk) ? chunk : chunk.toString())
          log(`${stag} Message`, data)

          switch (data?.type) {
            case 'CONNECTED': {
              if (data.id === 'diagnostics') {
                return emit({ type: 'PUBLISHING_DIAGNOSTICS' })
              }
              break
            }
            case RUN_DIAGNOSTICS: {
              return emit({
                type: 'DIAGNOSTICS',
                diagnostics: await runDiagnostics(data),
              })
            }
          }

          messages.push({
            type: data?.type,
            timestamp: new Date().toISOString(),
          })
        })
      })
      .on('listening', () => log(`${tag} Listening`))
      .on('close', () => log(`${tag} Closed`))
      .on('error', (err) => console.error(`${tag} Error`, serializeErr(err)))
  }

  /**
   *
   * @param { import('webpack-dev-server/types/lib/Server') } devServer
   */
  function registerRoutes() {
    const findMatchingFileName = (filepaths, n) =>
      filepaths.find((fp) => fp.includes(n))

    devServer?.app?.get('/analysis', (req, res) => {
      res.status(200).sendFile(path.join(basedir, 'analysis.html'))
    })

    devServer?.app?.get(`/analysis/:appname/assets/:filename`, (req, res) => {
      let { appname, filename } = req.params
      log(`Requesting asset: ${coolGold(filename)}`)
      const glob = path.join(basedir, appname, 'assets', filename)
      const filepaths = fg.sync(glob)
      const filepath = findMatchingFileName(filepaths, filename)
      if (filepath) res.sendFile(filepath)
      else res.status(500).json({ error: `File "${filename}" not found` })
    })

    devServer?.app?.get(`/analysis/:appname/:filename`, (req, res) => {
      let { appname = configKey, filename } = req.params
      log(`Requesting file: ${aqua(filename)}`)
      if (filename.includes('_en')) filename = filename.replace('_en', '')
      const glob = path.join(basedir, appname, '**/*.yml')
      const filepaths = fg.sync(glob)
      const filepath = findMatchingFileName(filepaths, filename)
      const fileyml = loadAsYml(filepath)
      res.status(200).json(fileyml)
    })

    devServer?.app?.get(`/analysis/info`, (req, res) => {
      res.status(200).json({
        mode: devServer.app.settings?.env,
        appDir,
        basedir,
        configKey,
        env,
        messages,
        testDir,
        webpackConfig: webpackConfig,
        watcher: {
          args: watchOptions,
          glob: watchGlobs,
          options: {
            cwd: watcher.options.cwd,
            depth: watcher.options.depth,
          },
          watchedFiles: watcher.getWatched(),
        },
        wss: {
          client: {
            buffered: socket?.bufferedAmount,
            status:
              socket?.readyState === 0
                ? 'closed'
                : socket?.readyState === 1
                ? 'opened'
                : socket?.readyState === 2
                ? 'closing'
                : socket?.readyState === 3
                ? 'closed'
                : 'unknown',
            protocol: socket?.protocol,
            url: socket?.url,
          },
          clients: Array.from(wss.clients).map((client) => ({
            isClosed: client?.readyState === client.CLOSED,
            isClosing: client?.readyState === client.CLOSING,
            isConnecting: client?.readyState === client.CONNECTING,
            isOpened: client?.readyState === client.OPEN,
            buffered: client?.bufferedAmount,
          })),
          args: wssOptions,
          address: wss.address().address,
          path: wss.path,
          port: wss.address().port,
        },
      })
    })
  }

  // const compiler = webpack({
  //   ...webpackConfig,
  //   devServer: {
  //     ...u.omit(webpackConfig?.devServer, ['onAfterSetupMiddleware', 'proxy']),
  //     host: '127.0.0.1',
  //     port: 3001,
  //     devMiddleware: {
  //       writeToDisk: false,
  //     },
  //   },
  //   plugins: [
  //     ...(webpackConfig?.plugins?.filter?.(
  //       (plugin) => !(plugin instanceof webpack.ProgressPlugin),
  //     ) || []),
  //     new webpack.EnvironmentPlugin({
  //       APP: env?.APP || env?.CONFIG,
  //     }),
  //   ],
  // })

  // compiler.watch({}, (err, stats) => {
  //   if (err) {
  //     console.error(err)
  //     throw err
  //   } else {
  //     log(cyan(`Analysis server running at http://127.0.0.1:3001`))
  //   }
  // })

  return {
    basedir,
    watch,
    /**
     * @param { ws.ServerOptions } opts
     */
    listen: (opts) => listen({ ...wssOptions, ...opts }),
    registerRoutes: () => registerRoutes(devServer),
    get watcher() {
      return watcher
    },
  }
}

module.exports.createAnalysisModule = createAnalysisModule
