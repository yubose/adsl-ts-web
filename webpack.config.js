const u = require('@jsmanifest/utils')
const { toJson } = require('@noodl/yaml')
const y = require('yaml')
const path = require('path')
const del = require('del')
const fs = require('fs-extra')
const fg = require('fast-glob')
const webpack = require('webpack')
const singleLog = require('single-line-log').stdout
const CircularDependencyPlugin = require('circular-dependency-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const WorkboxPlugin = require('workbox-webpack-plugin')
const InjectBodyPlugin = require('inject-body-webpack-plugin').default
const InjectScriptsPlugin = require('./scripts/InjectScriptsPlugin')

const serializeErr = (err) => ({
  name: err.name,
  message: err.message,
  stack: err.stack,
})
const getFilePath = (...s) => path.join(__dirname, ...s)
const log = console.log
const filename = 'index.html'
const readFile = (s) => fs.readFileSync(s, 'utf8')
const { cyan, magenta, yellow, white } = u

const paths = {
  analysis: {
    base: getFilePath('./analysis'),
    app: getFilePath('./analysis/app'),
    testpage: getFilePath('./analysis/testpage'),
  },
  build: getFilePath('build'),
  public: getFilePath('public'),
  pkg: {
    current: getFilePath('./package.json'),
    'noodl-types': getFilePath('./packages/noodl-types/package.json'),
    'noodl-ui': getFilePath('./packages/noodl-ui/package.json'),
    'noodl-utils': getFilePath('./packages/noodl-utils/package.json'),
  },
  generated: getFilePath('./generated'),
}

/**
 * @type { Record<'name' | 'title' | 'description' | 'favicon' | 'keywords' | 'injectScripts', any> }
 */
const settings = y.parse(readFile(getFilePath('settings.yml')))

function getWebpackConfig(env) {
  let ecosEnv = env.ECOS_ENV || process.env.ECOS_ENV
  let nodeEnv = env.NODE_ENV || process.env.NODE_ENV
  let mode = nodeEnv !== 'production' ? 'development' : 'production'

  if (!ecosEnv) {
    let msg =
      `You did not provide the ecos environment.  ` +
      `Defaulting to ${cyan((ecosEnv = 'stable'))}`
    log(yellow(msg))
  }

  const pkgJson = {
    current: require(paths.pkg.current),
    'noodl-types': require(paths.pkg['noodl-types']),
    'noodl-ui': require(paths.pkg['noodl-ui']),
    'noodl-utils': require(paths.pkg['noodl-utils']),
  }

  let pkgVersionPaths = String(pkgJson.current.version).split('.')
  let pkgVersionRev = Number(pkgVersionPaths.pop())
  let outputFileName = ''
  let buildVersion = ''

  if (fs.existsSync(paths.build)) del.sync(path.join(paths.build, '**/*'))

  outputFileName =
    mode === 'production' ? `[name].[contenthash].js` : '[name].js'

  if (!Number.isNaN(pkgVersionRev)) {
    buildVersion = [...pkgVersionPaths, ++pkgVersionRev].join('.')
  }

  const version = {
    lvl2:
      pkgJson.current.dependencies['@aitmed/ecos-lvl2-sdk'] ||
      pkgJson.current.devDependencies['@aitmed/ecos-lvl2-sdk'],
    lvl3:
      pkgJson.current.dependencies['@aitmed/cadl'] ||
      pkgJson.current.devDependencies['@aitmed/cadl'],
    'noodl-types': pkgJson['noodl-types'].version,
    'noodl-ui': pkgJson['noodl-ui'].version,
    'noodl-utils': pkgJson['noodl-utils'].version,
  }

  /**
   * @type { import('webpack').Configuration } webpackOptions
   */
  const webpackOptions = {
    entry: {
      main: [process.env.SAMPLE ? './src/sample.ts' : './src/index.ts'],
    },
    output: {
      // Using content hash when "watching" makes webpack save assets which might increase memory usage
      filename: outputFileName,
      path: paths.build,
    },
    ignoreWarnings: [/InjectManifest/],
    mode,
    devServer: {
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '127.0.0.1:3000',
        'aitmed.com',
        'aitmed.io',
      ],
      /**
       * @param { import('webpack-dev-server/types/lib/Server') } devServer
       */
      onAfterSetupMiddleware: function (devServer) {
        if (devServer) {
          devServer.app.get('/routes', (req, res) => {
            res.status(200).json({ ...devServer.app._router })
          })

          const analysis = createAnalysisModule(paths.analysis.base, {
            devServer,
            watchOptions: {
              //
            },
            wssOptions: {
              //
            },
          })

          analysis.registerRoutes()
          analysis.watch()
          analysis.listen()
        }
      },
      compress: false,
      devMiddleware: { writeToDisk: true },
      host: '127.0.0.1',
      hot: 'only',
      headers: {
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
          'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      },
      port: 3000,
      // proxy: {
      //   '/analysis': 'http://127.0.0.1:3000/analysis/app',
      //   '/analysis/app': 'http://127.0.0.1:3000/analysis/app',
      //   '/analysis/testpage': 'http://127.0.0.1:3000/analysis/testpage',
      // },
      static: [paths.public, paths.analysis.base, paths.analysis.app],
    },
    devtool: false,
    externals: [],
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
          exclude: /\.module\.css$/,
        },
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          include: getFilePath('src'),
          use: [
            {
              loader: 'esbuild-loader',
              options: { loader: 'ts', target: 'es2017' },
            },
          ],
        },
      ],
    },
    resolve: {
      alias: { fs: getFilePath('./node_modules/fs-extra') },
      cache: true,
      extensions: ['.ts', '.js'],
      modules: ['node_modules'],
      fallback: {
        assert: false,
        constants: require.resolve('constants-browserify'),
        crypto: require.resolve('crypto-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        path: require.resolve('path-browserify'),
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
      },
    },
    plugins: [
      new WorkboxPlugin.InjectManifest({
        swSrc: getFilePath('./src/firebase-messaging-sw.ts'),
        swDest: 'firebase-messaging-sw.js',
        maximumFileSizeToCacheInBytes: 500000000,
        mode: 'production',
        manifestTransforms: [
          /**
           * @param { WorkboxPlugin.ManifestEntry[] } entries
           * @param { webpack.Compilation } compilation
           * @returns
           */
          (entries) => {
            const mainBundleRegExp = /\.\w{20}\.js$/i
            for (const entry of entries) {
              if (entry.url.match(mainBundleRegExp)) {
                // Force the worker to use the url as the revision
                entry.revision = null
              }
            }
            return { manifest: entries, warnings: [] }
          },
        ],
        mode: 'production',
      }),
      new webpack.ProvidePlugin({ process: 'process' }),
      new CircularDependencyPlugin({
        exclude: /node_modules/,
        include: /(src)/,
      }),
      new webpack.ContextReplacementPlugin(
        /date\-fns[\/\\]/,
        new RegExp(`[/\\\\\](${['en-US'].join('|')})[/\\\\\]index\.js$`),
      ),
      new webpack.EnvironmentPlugin({
        BUILD: {
          version: buildVersion,
          ecosEnv: ecosEnv,
          nodeEnv: mode,
          packages: {
            '@aitmed/cadl': version.lvl3,
            '@aitmed/ecos-lvl2-sdk': version.lvl2,
            'noodl-types': version['noodl-types'],
            'noodl-ui': version['noodl-ui'],
            'noodl-utils': version['noodl-utils'],
          },
          timestamp: new Date().toLocaleString(),
        },
        // if process.env.DEPLOYING === true, this forces the config url in
        // src/app/noodl.ts to point to the public.aitmed.com host
        ECOS_ENV: ecosEnv,
        NODE_ENV: mode,
        USE_DEV_PATHS: !!process.env.USE_DEV_PATHS,
        ...(!u.isUnd(env.DEPLOYING)
          ? {
              DEPLOYING:
                env.DEPLOYING === true || env.DEPLOYING === 'true'
                  ? true
                  : false,
            }
          : undefined),
        LOCAL_CONFIG_URL: env.APP ? `${env.APP}/${env.APP}.yml` : '',
      }),
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        filename,
        title: settings.title,
        favicon: settings.favicon,
        cache: true,
        scriptLoading: 'defer',
        minify: true,
        meta: {
          description: settings.description,
          keywords: settings.keywords.join(', '),
          viewport:
            'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no',
        },
      }),
      new HtmlWebpackHarddiskPlugin(),
      new InjectBodyPlugin({
        content: `<div id="root"></div>`,
        position: 'start',
      }),
      new CopyPlugin({
        patterns: [
          {
            from: 'public/piBackgroundWorker.js',
            to: 'piBackgroundWorker.js',
          },
          {
            from: 'public/jsstoreWorker.min.js',
            to: 'jsstoreWorker.min.js',
          },
          { from: 'public/sql-wasm.wasm', to: 'sql-wasm.wasm' },
        ],
      }),
      new webpack.ProgressPlugin({
        handler: webpackProgress,
      }),
      ...((settings.injectScripts && [
        new InjectScriptsPlugin({ path: settings.injectScripts }),
      ]) ||
        []),
    ],
    optimization:
      mode === 'production'
        ? {
            concatenateModules: true,
            mergeDuplicateChunks: true,
            minimize: true,
            nodeEnv: 'production',
            removeEmptyChunks: true,
            splitChunks: {
              chunks: 'async',
              minSize: 35000,
              maxSize: 80000,
              minChunks: 8,
              maxAsyncRequests: 30,
              maxInitialRequests: 30,
              automaticNameDelimiter: '~',
              enforceSizeThreshold: 50000,
              cacheGroups: {
                defaultVendors: {
                  test: /[\\/]node_modules[\\/]/,
                  priority: -10,
                },
                default: {
                  minChunks: 5,
                  priority: -20,
                  reuseExistingChunk: true,
                },
              },
            },
          }
        : undefined,
  }

  const getEcosEnv = () =>
    ecosEnv ? ecosEnv.toUpperCase() : '<Variable not set>'

  const getNodeEnv = () => (mode ? mode.toUpperCase() : '<Variable not set>')

  /**
   * @param { number } percentage
   * @param { string } msg
   * @param { ...string } args
   */
  function webpackProgress(percentage, msg, ...args) {
    process.stdout.write('\x1Bc')
    // prettier-ignore
    singleLog(
  `Your app is being built for ${cyan(`eCOS`)} ${magenta(getEcosEnv())} environment in ${cyan(getNodeEnv())} mode\n
  Version:   ${cyan(buildVersion)}
  Status:    ${cyan(msg.toUpperCase())}
  File:      ${magenta(args[0])}
  Progress:  ${magenta(percentage.toFixed(4) * 100)}%

  ${cyan('eCOS packages')}:
  ${white(`@aitmed/cadl`)}:            ${magenta(version.lvl3)}
  ${white(`@aitmed/ecos-lvl2-sdk`)}:   ${magenta(version.lvl2)}
  ${white(`noodl-types`)}:             ${magenta(version['noodl-types'])}
  ${white(`noodl-ui`)}:                ${magenta(version['noodl-ui'])}
  ${white(`noodl-utils`)}:             ${magenta(version['noodl-utils'])}
  ${mode === 'production'
      ? `\nAn ${magenta(filename)} file will be generated inside your ${magenta('build')} directory. \nThe title of the page was set to ${yellow(settings.title)}`
      : ''
  }\n\n`)
  }

  return [webpackOptions]
}

module.exports = getWebpackConfig
module.exports.settings = settings

/** @type { webpack.Configuration } */
// const workerConfig = {
//   entry: {
//     piBackgroundWorker: getFilePath('src/piBackgroundWorker.ts'),
//   },
//   output: {
//     filename: '[name].js',
//     path: paths.build,
//   },
//   devtool: mode === 'production' ? false : 'source-map',
//   mode: mode,
//   module: {
//     rules: [
//       {
//         test: /\.(js|ts)?$/,
//         exclude: /node_modules/,
//         include: path.join(__dirname),
//         use: [
//           {
//             loader: 'esbuild-loader',
//             options: {
//               loader: 'ts',
//               target: 'es2017',
//               sourcemap: mode === 'production' ? undefined : 'inline',
//             },
//           },
//         ],
//       },
//     ],
//   },
//   resolve: {
//     extensions: ['.js', '.ts'],
//   },
// }

// return [webpackOptions, workerConfig]

/**
 * @param { string } basedir
 * @param { object } opts
 * @param { import('webpack-dev-server/types/lib/Server') } opts.devServer
 * @param { ws.ServerOptions } opts.wssOptions
 * @param { import('chokidar').WatchOptions & { glob?: string } } opts.watchOptions
 */
function createAnalysisModule(basedir = paths.analysis.base, opts = {}) {
  const { devServer, watchOptions = {}, wssOptions = {} } = opts

  const chokidar = require('chokidar')
  const ws = require('ws')

  const { glob: watchGlob = '*', ...watchOpts } = watchOptions

  /** @type chokidar.FSWatcher */
  let watcher

  /** @type ws.Server */
  let wss

  const appDir = path.join(basedir, 'app')
  const testDir = path.join(basedir, 'testpage')

  function watch(opts) {
    const tag = `[${u.blue('watch')}]`

    function emit(message) {
      wss.clients.forEach((client) => {
        client.send(JSON.stringify(message, null, 2), function onSend(err) {
          if (err) {
            console.log(`${tag} Error`, serializeErr(err))
          }
        })
      })
    }

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

    watcher = chokidar.watch(
      [path.join(appDir, '**/*'), path.join(testDir, '**/*')],
      { ignoreInitial: true, ...watchOpts },
    )

    watcher
      .on('ready', () => {
        const watchedFiles = watcher?.getWatched()
        const watchCount = watchedFiles
          ? u
              .values(watchedFiles)
              .reduce((count, files) => (count += files.length || 0), 0)
          : 0
        console.log(`${tag} Watching ${yellow(watchCount)} files`)
      })
      .on(
        'add',
        onWatchEvent((args) => {
          emit({ type: 'ADD', ...args })
        }),
      )
      .on(
        'addDir',
        onWatchEvent((args) => {
          emit({ type: 'ADD_DIRECTORY', ...args })
        }),
      )
      .on(
        'change',
        onWatchEvent((args) => {
          emit({ type: 'CHANGE', ...args })
        }),
      )
      .on('error', (err) => {
        emit({ type: 'ERROR', ...serializeErr(err) })
      })
      .on('unlink', (filepath) => {
        emit({ type: 'FILE_REMOVED', filepath })
      })
      .on('unlinkDir', (dir) => {
        emit({ type: 'DIRECTORY_REMOVED', dir })
      })
  }

  /**
   * @param { ws.ServerOptions } opts
   */
  function listen(opts) {
    const tag = `[${u.cyan('wss')}]`

    wss = new ws.WebSocketServer({
      port: 3020,
      ...opts,
    })

    wss
      .on('connection', (socket, req) => {
        console.log(`${tag} Connected`)
      })
      .on('listening', () => {
        console.log(`${tag} Listening`)
      })
      .on('close', () => {
        console.log(`${tag} Closed`)
      })
      .on('error', (err) => {
        console.error(`${tag} Error`, {
          name: err.name,
          message: err.message,
          stack: err.stack,
        })
      })
  }

  /**
   *
   * @param { import('webpack-dev-server/types/lib/Server') } devServer
   */
  function registerRoutes(devServer) {
    const findMatchingFileName = (fps, fn) => fps.find((fp) => fp.includes(fn))
    devServer.app.get(`/analysis/:appname/:filename`, (req, res) => {
      const loadAsYml = (p) => fs.readFileSync(p, 'utf8')
      const { appname, filename } = req.params
      const glob = path.join(paths.analysis[appname], '**/*.yml')
      const filepaths = fg.sync(glob)
      const filepath = findMatchingFileName(filepaths, filename)
      const fileyml = loadAsYml(filepath)
      res.status(200).json(fileyml)
      // const filename = path.basename(filepath, '.yml')
      // const name = filename.replace(/_en|\.yml$/gi, '')
    })
  }

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
