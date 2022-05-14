const u = require('@jsmanifest/utils')
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
// const TerserPlugin = require('terser-webpack-plugin')
const WorkboxPlugin = require('workbox-webpack-plugin')
const InjectBodyPlugin = require('inject-body-webpack-plugin').default
const InjectScriptsPlugin = require('./scripts/InjectScriptsPlugin')

const getFilePath = (...s) => path.join(__dirname, ...s)
const log = console.log
const filename = 'index.html'
const readFile = (s) => fs.readFileSync(s, 'utf8')
const { bold, cyan, magenta, newline, yellow, white } = u

const paths = {
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
 * ONLY used if passed in via --env
 * (ex: npm run start:test -- --env APP=admind3 --env)
 *
 * Web app will load from './generated/admind3/admind3.yml'
 * and will be passed in as configUrl in src/app/noodl.ts
 *
 * To change the directory "generated" pass in --env DIR=<directory>
 * (ex: npm run start:test -- --env APP=admind3 --env DIR=../cadl)
 * Web app will load from '../cadl/admind3.yml'
 */
function _getLocalAppHelpers(env = {}) {
  let rootDir = paths.public
  let app = env.APP // admind3
  let staticPaths = ['public']
  let appDir = ''

  const resolveDir = (...s) => path.join(rootDir, '..', ...s)
  const getAppName = () => app?.replace?.(/\.?yml$/, '')
  const getAppConfigFileName = () => getAppName()?.concat?.('.yml') || ''

  if (env.DIR) {
    try {
      if (!fs.existsSync(getFilePath(env.DIR))) throw ''
    } catch (error) {
      throw new Error(
        `The directory you provided as ` +
          `${yellow(getFilePath(env.DIR))} does not exist`,
      )
    }
    appDir = resolveDir(env.DIR)
    staticPaths.push(path.join('..', env.DIR, getAppName()))
  }

  return {
    getStaticPaths: () => staticPaths,
    getAppConfigFileName,
    getLocalConfigUrl: () =>
      appDir
        ? path.join('.', env.DIR, getAppName(), getAppConfigFileName())
        : '',
  }
}

/**
 * @type { Record<'name' | 'title' | 'description' | 'favicon' | 'keywords' | 'injectScripts', any> }
 */
const settings = y.parse(readFile(getFilePath('settings.yml')))

function getWebpackConfig(env) {
  let ecosEnv = env.ECOS_ENV || process.env.ECOS_ENV
  let nodeEnv = env.NODE_ENV || process.env.NODE_ENV
  let mode = nodeEnv !== 'production' ? 'development' : 'production'
  // if (!env.CONFIG) {
  //   throw new Error(`You did not provide a config key`)
  // }
  let staticPaths = [paths.public]
  staticPaths.push(`generated`, 'analysis', 'generated/analysis')

  if (!ecosEnv) {
    log(
      yellow(
        `You did not provide the ecos environment. Defaulting to ` +
          `${cyan(`stable`)}`,
      ),
    )
    ecosEnv = 'stable'
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

  if (!Number.isNaN(pkgVersionRev)) {
    buildVersion = [...pkgVersionPaths, ++pkgVersionRev].join('.')
    outputFileName =
      mode === 'production' ? `[name].[contenthash].js` : '[name].js'
  } else {
    outputFileName =
      mode === 'production' ? `[name].[contenthash].js` : '[name].js'
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
        '127.0.0.1:4000',
        'https://127.0.0.1',
        'https://127.0.0.1:3000',
        'https://127.0.0.1:4000',
        'aitmed.com',
        'aitmed.io',
      ],
      onAfterSetupMiddleware: function (devServer) {
        if (devServer) {
          const n = require('@noodl/core')
          const ny = require('@noodl/yaml')

          const diagnostics = new n.Diagnostics()
          const docRoot = new ny.DocRoot()
          const docVisitor = new ny.DocVisitor()
          const nfs = ny.createFileSystem({
            existsSync: fs.existsSync,
            parseFilePath: path.parse,
            readFile: fs.readFileSync,
            writeFile: fs.writeFileSync,
            readJson: fs.readJsonSync,
            writeJson: fs.writeJsonSync,
            readdir: fs.readdirSync,
          })

          diagnostics.use(docRoot)
          diagnostics.use(docVisitor)
          docRoot.use(nfs)

          devServer.app.get(`/diagnostics/:config`, function (req, res) {
            console.log(`[get] ${u.yellow(`/diagnosis/${req.params.config}`)}`)
            const configKey = req.params.config
            const pathToAppDir = path.join(paths.generated, configKey)
            const pathToRootConfigFile = path.join(
              pathToAppDir,
              `${configKey}.yml`,
            )
            const pathToAppConfigFile = path.join(
              pathToAppDir,
              `cadlEndpoint.yml`,
            )
            const pathToAssetsDir = path.join(pathToAppDir, 'assets')
            const ymlFilepaths = fg.sync(path.join(pathToAppDir, '**/*.yml'))
            const filteredPages = ymlFilepaths.filter((filepath) => {
              return /base|sign|menu|cov19/i.test(filepath)
            })

            filteredPages.forEach((filepath) => {
              docRoot.loadFileSync(filepath, {
                renameKey: (filename) => {
                  if (filename.endsWith('.yml')) {
                    return filename.replace('.yml', '')
                  }
                },
              })
            })

            const results = diagnostics.run({
              enter: ({
                add,
                data,
                key,
                pageName,
                value,
                name,
                root,
                path: nodePath,
              }) => {
                if (ny.is.button(value)) {
                  const [start, end] = value.range || []
                  add({
                    isKey: key === 'key',
                    isValue: key === 'value',
                    isIndex: typeof key === 'number',
                    messages: [
                      {
                        type: n.consts.ValidatorType.INFO,
                        message: `Encountered button with keys: ${value.items
                          .map((pair) => pair.key)
                          .join(', ')}`,
                        start,
                        end,
                        srcToken: value.srcToken,
                      },
                    ],
                    page: (pageName || name).replace(/_en/g, ''),
                  })
                }
              },
            })

            console.log(`[get]`, {
              pathToAppDir,
              pathToRootConfigFile,
              pathToAppConfigFile,
              pathToAssetsDir,
              filteredPages,
            })

            res.status(200).json(results)
          })
        }
      },
      compress: false,
      devMiddleware: {
        writeToDisk: true,
      },
      host: '127.0.0.1',
      hot: 'only',
      // liveReload: true,
      headers: {
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
          'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      },
      port: 3000,
      static: staticPaths,
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
      alias: {
        fs: getFilePath('./node_modules/fs-extra'),
      },
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
            // minimizer: [
            //   new TerserPlugin({
            //     minify: TerserPlugin.esbuildMinify,
            //     parallel: true,
            //     terserOptions: {
            //       minify: false,
            //       minifyWhitespace: true,
            //       minifyIdentifiers: false,
            //       minifySyntax: true,
            //     },
            //   }),
            // ],
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

  /** @type { webpack.Configuration } */
  const workerConfig = {
    entry: {
      piBackgroundWorker: getFilePath('src/piBackgroundWorker.ts'),
    },
    output: {
      filename: '[name].js',
      path: paths.build,
    },
    devtool: mode === 'production' ? false : 'source-map',
    mode: mode,
    module: {
      rules: [
        {
          test: /\.(js|ts)?$/,
          exclude: /node_modules/,
          include: path.join(__dirname),
          use: [
            {
              loader: 'esbuild-loader',
              options: {
                loader: 'ts',
                target: 'es2017',
                sourcemap: mode === 'production' ? undefined : 'inline',
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.ts'],
    },
  }

  // return [webpackOptions, workerConfig]
  return [webpackOptions]
}

module.exports = getWebpackConfig
module.exports.settings = settings
