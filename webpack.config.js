const u = require('@jsmanifest/utils')
const path = require('path')
const del = require('del')
const fs = require('fs-extra')
const webpack = require('webpack')
const singleLog = require('single-line-log').stdout
const CircularDependencyPlugin = require('circular-dependency-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const InjectBodyPlugin = require('inject-body-webpack-plugin').default
const WorkboxPlugin = require('workbox-webpack-plugin')
const InjectScriptsPlugin = require('./scripts/InjectScriptsPlugin')

del.sync(path.resolve(path.join(process.cwd(), 'build')))

const TITLE = 'AiTmed: Start your E-health Journey Anywhere, Anytime'
const DESCRIPTION = `Anyone, Anywhere, Anytime Start Your E-health Journey With Us`
const KEYWORDS = [
  'aitmed',
  'noodl',
  'telemedicine',
  'telehealth',
  'blockchain Telemedicine',
  'Fast, Private, Secure',
  'Blockchain Telehealth Platform',
  'HIPAA Compliance',
  'Pandemic',
  'Covid19',
  'Wellness and illness',
  'Telemedicine clinic',
  'Telemedicine Pediatric',
  'Telemedicine Urgent Care',
  'Telemedicine dermatology',
  'Telemedicine Senior House',
  'Telemedicine Hospital',
  'Telemedicine RADIOLOGY',
  'Telemedicine Neurology',
  'Telehealth Lab',
  'Telehealth Pandemic',
  'Telehealth Covid19',
  'Telehealth clinic',
  'Telehealth Pediatric',
  'Telehealth Urgent Care',
  'Telehealth dermatology',
  'Telehealth Senior House',
  'Telehealth Hospital',
  'Telehealth RADIOLOGY',
  'Telehealth Neurology',
  'Telehealth Lab',
  'Doctor Virtual Platform',
  'Telemedicine Imaging',
  'Online Medical Practice',
  'Online schedule',
  'E-prescription',
  'Virtual Meeting Room',
  'Virtual platform',
  'Secure Platform',
  'Virtual Visit',
  'Private Visit',
  'doctor',
  'patient',
  'chronic illness',
  'Medical clinic',
  'medical platform',
  'Medical knowledge',
  'telecommunication',
  'virtual',
  'Vital Sign',
]
const FAVICON = 'public/favicon.ico'

const pkg = fs.readJsonSync('./package.json')
const nuiPkg = fs.readJsonSync('./packages/noodl-ui/package.json')
const ndomPkg = fs.readJsonSync('./packages/noodl-ui-dom/package.json')
const ntypesPkg = fs.readJsonSync('./packages/noodl-types/package.json')
const nutilsPkg = fs.readJsonSync('./packages/noodl-utils/package.json')

const filename = 'index.html'
const publicPath = path.join(process.cwd(), 'public')
const buildPath = path.join(process.cwd(), 'build')

const ECOS_ENV = process.env.ECOS_ENV
const NODE_ENV = process.env.NODE_ENV
const MODE = NODE_ENV !== 'production' ? 'development' : 'production'

let pkgVersionPaths = String(pkg.version).split('.')
let pkgVersionRev = Number(pkgVersionPaths.pop())
let outputFileName = ''
let buildVersion = ''

if (!Number.isNaN(pkgVersionRev)) {
  buildVersion = [...pkgVersionPaths, ++pkgVersionRev].join('.')
  // fs.writeJsonSync(
  //   './package.json',
  //   { ...pkg, version: buildVersion },
  //   { spaces: 2 },
  // )
  outputFileName =
    MODE === 'production' ? `[name].[contenthash].js` : '[name].js'
  // MODE === 'production' ? `[name]${buildVersion}.js` : '[name].js'
} else {
  outputFileName =
    MODE === 'production' ? `[name].[contenthash].js` : '[name].js'
}

const pkgJson = {
  root: pkg,
  nui: nuiPkg,
  ndom: ndomPkg,
  nTypes: ntypesPkg,
  nutils: nutilsPkg,
}

const version = {
  noodlSdk:
    pkgJson.root.dependencies['@aitmed/cadl'] ||
    pkgJson.root.devDependencies['@aitmed/cadl'],
  ecosSdk:
    pkgJson.root.dependencies['@aitmed/ecos-lvl2-sdk'] ||
    pkgJson.root.devDependencies['@aitmed/ecos-lvl2-sdk'],
  nui: pkgJson.nui.version,
  ndom: pkgJson.ndom.version,
  nutil: pkgJson.nutils.version,
  nTypes: pkgJson.nTypes.version,
}

const commonHeaders = {
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
}

/**
 * @type { import('webpack').Configuration } webpackOptions
 */
const webpackOptions = {
  entry: {
    main: [process.env.SAMPLE ? './src/sample.ts' : './src/index.ts'],
  },
  output: {
    clean: true,
    // Using content hash when "watching" makes webpack save assets which might increase memory usage
    filename: outputFileName,
    path: buildPath,
  },
  ignoreWarnings: [/InjectManifest/],
  mode: MODE,
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
    compress: false,
    devMiddleware: {
      writeToDisk: true,
    },
    host: '127.0.0.1',
    hot: true,
    liveReload: true,
    headers: commonHeaders,
    port: 3000,
    static: [publicPath],
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
        include: path.resolve(path.join(process.cwd(), 'src')),
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
      fs: path.resolve(path.join(process.cwd(), './node_modules/fs-extra')),
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
      swSrc: path.join(process.cwd(), './src/firebase-messaging-sw.ts'),
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
          const mainBundleRegExp = /\.\w{20}\.js$/
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
        ecosEnv: ECOS_ENV,
        nodeEnv: MODE,
        packages: {
          '@aitmed/cadl': version.noodlSdk,
          '@aitmed/ecos-lvl2-sdk': version.ecosSdk,
          'noodl-types': version.nTypes,
          'noodl-ui': version.nui,
          'noodl-utils': version.nutil,
          'noodl-ui-dom': version.ndom,
        },
        timestamp: new Date().toLocaleString(),
      },
      // if process.env.DEPLOYING === true, this forces the config url in
      // src/app/noodl.ts to point to the public.aitmed.com host
      ECOS_ENV,
      NODE_ENV: MODE,
      USE_DEV_PATHS: !!process.env.USE_DEV_PATHS,
      ...(!u.isUnd(process.env.DEPLOYING)
        ? {
            DEPLOYING:
              process.env.DEPLOYING === true || process.env.DEPLOYING === 'true'
                ? true
                : false,
          }
        : undefined),
    }),
    new HtmlWebpackPlugin({
      alwaysWriteToDisk: true,
      filename,
      title: TITLE,
      favicon: FAVICON,
      cache: true,
      scriptLoading: 'defer',
      minify: true,
      meta: {
        description: DESCRIPTION,
        keywords: KEYWORDS.join(', '),
        viewport:
          'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no',
      },
    }),
    new HtmlWebpackHarddiskPlugin(),
    new InjectScriptsPlugin({ path: 'public/libs.html' }),
    new InjectBodyPlugin({
      content: `<div id="root"></div>`,
      position: 'start',
    }),
    new CopyPlugin({
      patterns: [
        // {
        //   from: 'public/worker.js',
        //   to: 'worker.js',
        // },
        { from: 'public/sql-wasm.wasm', to: 'sql-wasm.wasm' },
      ],
    }),
    new webpack.ProgressPlugin({
      handler: webpackProgress,
    }),
  ],
  optimization:
    MODE === 'production'
      ? {
          concatenateModules: true,
          mergeDuplicateChunks: true,
          minimize: true,
          nodeEnv: 'production',
          removeEmptyChunks: true,
          splitChunks: {
            // chunks(chunk) {
            //   // console.log(`[${u.cyan('chunk')}]`, chunk)
            //   return true
            // },
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
  ECOS_ENV ? ECOS_ENV.toUpperCase() : '<Variable not set>'

const getNodeEnv = () => (MODE ? MODE.toUpperCase() : '<Variable not set>')

/**
 * @param { number } percentage
 * @param { string } msg
 * @param { ...string } args
 */
function webpackProgress(percentage, msg, ...args) {
  process.stdout.write('\x1Bc')
  // prettier-ignore
  singleLog(
  `Your app is being built for ${u.cyan(`eCOS`)} ${u.magenta(getEcosEnv())} environment in ${u.cyan(getNodeEnv())} MODE\n
  Version:   ${u.cyan(buildVersion)}
  Status:    ${u.cyan(msg.toUpperCase())}
  File:      ${u.magenta(args[0])}
  Progress:  ${u.magenta(percentage.toFixed(4) * 100)}%
  ${u.cyan('eCOS packages')}:
  ${u.white(`@aitmed/cadl`)}:            ${u.magenta(version.noodlSdk)}
  ${u.white(`@aitmed/ecos-lvl2-sdk`)}:   ${u.magenta(version.ecosSdk)}
  ${u.white(`noodl-types`)}:             ${u.magenta(version.nTypes)}
  ${u.white(`noodl-ui`)}:                ${u.magenta(version.nui)}
  ${u.white(`noodl-ui-dom`)}:            ${u.magenta(version.ndom)}
  ${u.white(`noodl-utils`)}:             ${u.magenta(version.nutil)}
  ${MODE === 'production'
      ? `\nAn ${u.magenta(filename)} file will be generated inside your ${u.magenta('build')} directory. \nThe title of the page was set to ${u.yellow(TITLE)}`
      : ''
  }\n\n`)
}

module.exports.TITLE = TITLE
module.exports.DESCRIPTION = DESCRIPTION
module.exports.KEYWORDS = KEYWORDS
module.exports = webpackOptions
