const u = require('@jsmanifest/utils')
const y = require('yaml')
const path = require('path')
const del = require('del')
const fs = require('fs-extra')
const webpack = require('webpack')
const singleLog = require('single-line-log').stdout
const CircularDependencyPlugin = require('circular-dependency-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const WorkboxPlugin = require('workbox-webpack-plugin')
const InjectBodyPlugin = require('inject-body-webpack-plugin').default
const InjectScriptsPlugin = require('./InjectScriptsPlugin')
const TerserPlugin = require('terser-webpack-plugin')
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
  },
  debug: getFilePath('./debug'),
  build: getFilePath('../../output/apps/web'),
  public: getFilePath('public'),
  pkg: {
    current: getFilePath('./package.json'),
  },
  generated: getFilePath('../../generated'),
}

// console.log(paths)

/**
 * @type { Record<'name' | 'title' | 'description' | 'favicon' | 'keywords' | 'injectScripts', any> }
 */
const settings = y.parse(readFile(getFilePath('../../settings.yml')))

function getWebpackConfig(env) {
  let ecosEnv = env.ECOS_ENV || process.env.ECOS_ENV
  let nodeEnv = env.NODE_ENV || process.env.NODE_ENV
  let plateformEnv = env.PLATEFORM_ENV || process.env.PLATEFORM_ENV
  let mode = nodeEnv !== 'production' ? 'development' : 'production'
  let webappEnv = env.BUILD_WEBAPP || process.env.BUILD_WEBAPP
  let build_web = webappEnv == 'dev' ? 'development' : 'production'


  if (!ecosEnv) {
    let msg =
      `You did not provide the ecos environment.  ` +
      `Defaulting to ${cyan((ecosEnv = 'stable'))}`
    log(yellow(msg))
  }

  const pkgJson = {
    current: require(paths.pkg.current),
  }

  let pkgVersionPaths = String(pkgJson.current.version).split('.')
  let pkgVersionRev = Number(pkgVersionPaths.pop())
  let outputFileName = ''
  let buildVersion = ''

  if (fs.existsSync(paths.build)) {
    del.sync(path.join(paths.build, '**/*'), { force: true, overwrite: true })
  }

  outputFileName =
    mode === 'production' ? `[name].[contenthash].js` : '[name].js'

  if (!Number.isNaN(pkgVersionRev)) {
    buildVersion = [...pkgVersionPaths, pkgVersionRev].join('.')
  }

  const version = {
    lvl2:
      pkgJson.current.dependencies['@aitmed/ecos-lvl2-sdk'] ||
      pkgJson.current.devDependencies['@aitmed/ecos-lvl2-sdk'],
    lvl3:
      pkgJson.current.dependencies['@aitmed/cadl'] ||
      pkgJson.current.devDependencies['@aitmed/cadl'],
    noodlUi:
      pkgJson.current.dependencies['noodl-ui'] ||
      pkgJson.current.devDependencies['noodl-ui'],
    noodlTypes:
      pkgJson.current.dependencies['noodl-types'] ||
      pkgJson.current.devDependencies['noodl-types'],
  }

  const staticPaths = [paths.public]
  const devServerOptions = { onAfterSetupMiddleware: [], static: staticPaths }
  const environmentPluginOptions = {}

  if (env.APP || env.DEBUG || env.DEBUG_APP) {
    // TODO - env.APP is broken. Pass in env.DEBUG instead
    if (env.APP) {
      environmentPluginOptions.ANALYSIS_APP = env.APP
      devServerOptions.static.push(paths.analysis.base)
      devServerOptions.static.push(paths.analysis.app)
      devServerOptions.onAfterSetupMiddleware.push(
        /**
         * @param { import('webpack-dev-server/types/lib/Server') } devServer
         */
        function onAfterSetupMiddleware(devServer) {
          const analysis = require('./analysis/server.js')
            .createAnalysisModule(paths.analysis.base, devServer, {
              env,
              webpackConfig: webpackOptions,
            })
            .registerRoutes()
          analysis.watch()
          analysis.listen()
        },
      )
    } else {
      const basedir = path.join(paths.debug, env.DEBUG_APP || env.DEBUG)
      environmentPluginOptions.DEBUG_APP = env.DEBUG_APP || env.DEBUG
      devServerOptions.static.push(basedir)
      devServerOptions.onAfterSetupMiddleware.push(
        /**
         * @param { import('webpack-dev-server/types/lib/Server') } devServer
         */
        function onAfterSetupMiddleware(devServer) {
          const createAppDebugger = require('../../scripts/createAppDebugger')
          const appDebugger = createAppDebugger({
            app: env.DEBUG_APP || env.DEBUG,
            basedir,
            devServer,
            env,
            watcherOptions: {
              glob: path.join(basedir, '**/*'),
            },
            wssOptions: {
              port: 3020,
            },
          })
          appDebugger.start()
        },
      )
    }
  }

  /**
   * @type { import('webpack').Configuration } webpackOptions
   */

  let headers = {
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  }
  mode === 'production' && (headers['Cache-Control'] = 'max-age=86400')
  const webpackOptions = {
    entry: {
      main: [
        process.env.SAMPLE
          ? getFilePath('src/sample.ts')
          : getFilePath('src/index.ts'),
      ],
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
      compress: true,
      // https: true,
      devMiddleware: { writeToDisk: true },
      host: '127.0.0.1',
      hot: 'only',
      headers: headers,
      client: {
        overlay: false,
      },
      port: 3000,
      ...u.omit(devServerOptions, ['onAfterSetupMiddleware']),
      /**
       * @type { import('webpack-dev-server')['setupMiddlewares'] }
       */
      setupMiddlewares(middlewares, devServer) {
        if (devServer) {
          devServer.app.get('/routes', (req, res) => {
            res.status(200).json({ ...devServer.app._router })
          })
          devServerOptions.onAfterSetupMiddleware.forEach((fn) => fn(devServer))
        }
        return middlewares
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:9999',
          secure: false,
          changeOrigin: true,
          pathRewrite: {
            '^/api': ''
          }
        }
      }
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
        
        
        // mode === 'production'?
        //   {
        //     test: /\.ts$/,
        //     use: [
        //       {
        //         loader: path.resolve(__dirname, './dropConsole.js'),
        //         options: {
        //           name: 'web',
        //         },
        //       },
        //     ],
        //   }:
        //   undefined
      ],
    },
    resolve: {
      alias: { fs: getFilePath('../../node_modules/fs-extra') },
      cache: true,
      extensions: ['.ts', '.js'],
      modules: ['node_modules'],
      fallback: {
        assert: false,
        buffer: false,
        constants: require.resolve('constants-browserify'),
        crypto: require.resolve('crypto-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        path: require.resolve('path-browserify'),
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        util: false,
      },
    },
    plugins: [
      new WorkboxPlugin.InjectManifest({
        swSrc: getFilePath('src/firebase-messaging-sw.ts'),
        swDest: mode === 'production'? path.resolve(paths.build, 'firebase-messaging-sw.js'):getFilePath('public/firebase-messaging-sw.js'),
        // swDest: getFilePath('firebase-messaging-sw.js'),
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
              }else if(entry.url.indexOf('apps/web') !== -1){
                entry.url = entry.url.replace('../../../apps/web/','')
              }
            }
            return { manifest: entries, warnings: [] }
          },
        ],
        mode: 'production',
      }),
      new WorkboxPlugin.InjectManifest({
        swSrc: getFilePath('src/image-load-sw.ts'),
        swDest: mode === 'production'? path.resolve(paths.build, 'image-load-sw.js'):getFilePath('public/image-load-sw.js'),
        // swDest: getFilePath('firebase-messaging-sw.js'),
        maximumFileSizeToCacheInBytes: 500000000,
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
          build_web: build_web,
          packages: {
            '@aitmed/cadl': version.lvl3,
            '@aitmed/ecos-lvl2-sdk': version.lvl2,
            '@aitmed/cadl': version.lvl3,
            'noodl-types': version.noodlTypes,
            'noodl-ui': version.noodlUi,
          },
          timestamp: new Date().toLocaleString(),
        },
        // if process.env.DEPLOYING === true, this forces the config url in
        // src/app/noodl.ts to point to the public.aitmed.com host
        ECOS_ENV: ecosEnv,
        NODE_ENV: mode,
        PLATEFORM_ENV: plateformEnv,
        USE_DEV_PATHS: !!process.env.USE_DEV_PATHS,
        ...(!u.isUnd(env.DEPLOYING)
          ? {
              DEPLOYING:
                env.DEPLOYING === true || env.DEPLOYING === 'true'
                  ? true
                  : false,
            }
          : undefined),
        ...environmentPluginOptions,
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
            from: getFilePath('public/piBackgroundWorker.js'),
            to: path.resolve(paths.build, 'piBackgroundWorker.js'),
          },
          {
            from: getFilePath('public/jsstoreWorker.min.js'),
            to: path.resolve(paths.build, 'jsstoreWorker.min.js'),
          },
          {
            from: getFilePath('public/sql-wasm.wasm'),
            to: path.resolve(paths.build, 'sql-wasm.wasm'),
          },
          {
            from: getFilePath('public/ring.mp3'),
            to: path.resolve(paths.build, 'ring.mp3'),
          },
          {
            from: getFilePath('public/chatDefaultImage.svg'),
            to: path.resolve(paths.build, 'chatDefaultImage.svg'),
          },
        ],
      }),
      // new TerserPlugin({
      //   cache: true,
      //   sourceMap: false,
      //   // 多进程
      //   parallel: true,
      //   terserOptions: {
      //     warnings: false,
      //     compress: {
      //       drop_console: false,
      //       drop_debugger: false
      //     }
      //   },
      // }),
      new webpack.ProgressPlugin({
        // handler: webpackProgress,
      }),
      ...((settings.injectScripts && [
        new InjectScriptsPlugin({ path: settings.injectScripts }),
      ]) ||
        []),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        },
      }),
    ],
    optimization:
      mode === 'production'
        ? {
            concatenateModules: true,
            mergeDuplicateChunks: true,
            minimize: true,
            minimizer: [
              new TerserPlugin({
                terserOptions: {
                  warnings: false,
                  compress: {
                    drop_console: false,
                    drop_debugger: false,
                  },
                },
              }),
            ],
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

process
  .on('exit', (exitCode) => {
    log(`Process exited with code ${u.yellow(exitCode)}`)
  })
  .on('uncaughtException', (err, origin) => {
    log(
      `Uncaught exception ${u.yellow(serializeErr(err))} - Origin: ${u.yellow(
        origin,
      )}`,
    )
  })
  .on('unhandledRejection', (reason) => {
    log(`Reason ${u.yellow(reason)}`)
  })
