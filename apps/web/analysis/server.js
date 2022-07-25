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
const createWss = require('../../../scripts/wss')
const watch = require('../../../scripts/watch')

const { log } = console
const { blue, cyan, green, magenta, red, yellow } = u
const loadAsYml = (p) => fs.readFileSync(p, 'utf8')
const aqua = chalk.keyword('aquamarine')
const coolGold = chalk.keyword('navajowhite')

/**
 * @param { unknown } error
 */
const serializeError = (error) => ({
  code: error?.code,
  name: error?.name,
  message: error?.message,
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
  /** @type { ReturnType<typeof createWss> } */
  let wssApi

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
        `${green(`Changed analysis app from `)}` +
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

  /**
   * @param { ws.ServerOptions } opts
   */
  function listen(opts) {
    wssApi = createWss({
      log,
      port: 3020,
      host: '127.0.0.1',
      on: {},
      serializeError,
      ...opts,
    })

    const stag = wssApi.tag.server

    wss = wssApi.server

    wssApi.on('message', async function onMessage(chunk) {
      const data = JSON.parse(u.isStr(chunk) ? chunk : chunk.toString())
      log(`${stag} Message`, data)

      switch (data?.type) {
        case 'CONNECTED': {
          if (data.id === 'diagnostics') {
            return wssApi.emit({ type: 'PUBLISHING_DIAGNOSTICS' })
          }
          break
        }
        case RUN_DIAGNOSTICS: {
          return wssApi.emit({
            type: 'DIAGNOSTICS',
            diagnostics: await runDiagnostics(data),
          })
        }
      }
    })

    return this
  }

  /**
   * @param { import('webpack-dev-server') } devServer
   * @param { { APP: string; local?: boolean } } env
   */
  function registerRoutes(devServer, env) {
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
      log(`Requesting file: ${aqua(filename)} in ${yellow(appname)} app`)
      if (filename.includes('_en')) filename = filename.replace('_en', '')
      if (filename.endsWith('.yml')) filename = filename.replace('.yml', '')
      log(`Formatted filename: ${yellow(filename)}`)
      const glob = path.join(basedir, appname, '**/*.yml')
      log(`Glob: ${yellow(glob)}`)
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

    if (env.local && devServer) {
      const dir = path.join(basedir, configKey)
      const glob = path.join(dir, '**/*')
      const getRouteFilePath = (r, ext = '') =>
        path.join(dir, r + (ext ? `.${ext}` : ''))

      if (!fs.existsSync(dir)) {
        throw new Error(`The directory ${yellow(dir)} does not exist`)
      }

      const routeFilePaths = [
        {
          name: configKey,
          path: getRouteFilePath(configKey, 'yml'),
          ext: '.yml',
        },
        {
          name: 'cadlEndpoint',
          path: getRouteFilePath('cadlEndpoint', 'yml'),
          ext: '.yml',
        },
      ]

      const filepaths = fg.sync(glob, { onlyFiles: true })

      filepaths.forEach((filepath) => {
        const routeObject = {
          name: path
            .basename(filepath, path.extname(filepath))
            .replace(/_en/, ''),
          path: filepath,
          ext: path.extname(filepath),
        }
        routeFilePaths.push(routeObject)
        if (!fs.existsSync(filepath)) {
          log(
            `${red(`The file at`)} ${yellow(filepath)} ${red(
              `does not exist`,
            )}`,
          )
        }
      })

      log(`Registering ${yellow(routeFilePaths.length)} routes`)

      routeFilePaths.forEach((obj) => {
        const trimmedName = obj.name.replace(/_en/, '')
        const route = obj.ext
          ? new RegExp(`(${trimmedName})(${obj.ext})$`)
          : new RegExp(trimmedName)
        log(`Registering route ${yellow(trimmedName)}`)

        devServer.app.get(route, (req, res) => {
          res.status(200).sendFile(obj.path)
        })
      })

      devServer.app.get('/local')
    }
    return this
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
    watch(opts) {
      return watch.call(this, {
        ...opts,
        ...watchOptions,
        basedir,
        log,
        on: {
          ready: (_, __, watchCount) => {
            log(`${watch.tag} Watching ${yellow(watchCount)} files`)
          },
          add: (args) => wssApi.emit(args),
          addDir: (args) => wssApi.emit(args),
          change: (args) => wssApi.emit(args),
          unlink: (args) => wssApi.emit(args),
          unlinkDir: (args) => wssApi.emit(args),
          error({ error }) {
            const err = serializeError(error)
            log(yellow(`[${err.name}] ${red(err.message)}`))
          },
        },
      })
    },
    /**
     * @param { ws.ServerOptions } opts
     */
    listen(opts) {
      return listen.call(this, { ...wssOptions, ...opts })
    },
    registerRoutes() {
      return registerRoutes.call(this, devServer, env)
    },
    get watcher() {
      return watcher
    },
  }
}

module.exports.createAnalysisModule = createAnalysisModule
