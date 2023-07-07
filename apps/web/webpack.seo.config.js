process.stdout.write('\x1Bc')
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

const getFilePath = (...s) => path.join(__dirname, ...s)
const log = console.log
const readFile = (s) => fs.readFileSync(s, 'utf8')
const { cyan, magenta, yellow, white } = u
const outputDir = path.join(__dirname, '../../output/apps/web')

function cleanupBuildDirectory() {
  del.sync(path.join(outputDir, '**/*'), { force: true, overwrite: true })
}

/**
 * @type { Record<'name' | 'title' | 'description' | 'favicon' | 'keywords' | 'injectScripts', any> }
 */
const settings = y.parse(readFile(getFilePath('../../settings.yml')))

/**
 * @typedef WebpackConfigEnvVariables
 * @type { object }
 * @property { string } [options.APP]
 * @property { string } [options.DEBUG]
 * @property { string } [options.DEBUG_APP]
 * @property { boolean } [options.DEPLOYING]
 * @property { 'stable' | 'test' } [options.ECOS_ENV]
 * @property { 'development' | 'production' } [options.NODE_ENV]
 * @property { string } options.WEBPACK_SERVE
 * @property { boolean } [options.USE_DEV_PATHS]
 */

module.exports = function getWebpackConfig({
  APP,
  DEBUG,
  DEBUG_APP,
  DEPLOYING,
  ECOS_ENV,
  USE_DEV_PATHS,
} = {}) {
  const NODE_ENV = process.env.NODE_ENV
  const mode = NODE_ENV !== 'production' ? 'development' : 'production'

  if (!ECOS_ENV) {
    log(
      yellow(
        `You did not provide the ecos environment.  ` +
          `Defaulting to ${cyan((ECOS_ENV = 'stable'))}`,
      ),
    )
  }

  const staticPaths = [getFilePath('./public')]
  const devServerOptions = { onAfterSetupMiddleware: [], static: staticPaths }
  const environmentPluginOptions = {}
  const pkgJson = require(getFilePath('./package.json'))

  let pkgVersionParts = String(pkgJson.version).split('.')
  let pkgVersionRev = Number(pkgVersionParts.pop())
  let buildVersion = ''

  if (fs.existsSync(outputDir)) cleanupBuildDirectory()

  if (!Number.isNaN(pkgVersionRev)) {
    buildVersion = [...pkgVersionParts, ++pkgVersionRev].join('.')
  }

  const version = [
    ['lvl2', '@aitmed/ecos-lvl2-sdk'],
    ['lvl3', '@aitmed/cadl'],
    ['noodl-ui', 'noodl-ui'],
    ['noodl-types', 'noodl-types'],
  ].reduce(
    (acc, [label, pkgName]) =>
      u.assign(acc, {
        [label]: ['dependencies', 'devDependencies'].find(
          (key) => !!pkgJson[key]?.[pkgName],
        ),
      }),
    {},
  )

  /**
   * @type { import('webpack').Configuration }
   */
  const webpackOptions = {
    entry: {
      main: [getFilePath('src/index.ts')],
    },
    output: {
      filename: mode === 'production' ? `[name].[contenthash].js` : `[name].js`,
      path: outputDir,
    },
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
      devMiddleware: { writeToDisk: true },
      host: '127.0.0.1',
      hot: 'only',
      headers: {
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
          'Origin, X-Requested-With, Content-Type, Accept, Authorization',
        ...(mode === 'production'
          ? { 'Cache-Control': 'max-age=86400' }
          : undefined),
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
    },
    devtool: false,
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
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        filename: 'index.html',
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
      new WorkboxPlugin.InjectManifest({
        swSrc: getFilePath('src/firebase-messaging-sw.ts'),
        swDest: getFilePath('firebase-messaging-sw.js'),
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
          ECOS_ENV,
          NODE_ENV: mode,
          packages: {
            '@aitmed/cadl': version.lvl3,
            '@aitmed/ecos-lvl2-sdk': version.lvl2,
            'noodl-types': version['noodl-types'],
            'noodl-ui': version['noodl-ui'],
          },
          timestamp: new Date().toLocaleString(),
        },
        // if DEPLOYING === true, this forces the config url in
        // src/app/noodl.ts to point to the public.aitmed.com host
        ECOS_ENV,
        NODE_ENV: mode,
        ...(!u.isUnd(DEPLOYING)
          ? {
              DEPLOYING:
                DEPLOYING === true || DEPLOYING === 'true' ? true : false,
            }
          : undefined),
        ...environmentPluginOptions,
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
            to: getFilePath('piBackgroundWorker.js'),
          },
          {
            from: getFilePath('public/jsstoreWorker.min.js'),
            to: getFilePath('jsstoreWorker.min.js'),
          },
          {
            from: getFilePath('public/sql-wasm.wasm'),
            to: getFilePath('sql-wasm.wasm'),
          },
        ],
      }),
      new webpack.ProgressPlugin({
        /* handler: webpackProgress */
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

  return webpackOptions
}
