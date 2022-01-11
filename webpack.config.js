const u = require('@jsmanifest/utils')
const path = require('path')
const fs = require('fs-extra')
const webpack = require('webpack')
const singleLog = require('single-line-log').stdout
const CircularDependencyPlugin = require('circular-dependency-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const InjectBodyPlugin = require('inject-body-webpack-plugin').default
const InjectScriptsPlugin = require('./scripts/InjectScriptsPlugin')

const TITLE = 'AiTmed: Start your E-health Journey Anywhere, Anytime'
const DESCRIPTION = `Anyone, Anywhere, Anytime Start Your E-health Journey With Us`
const KEYWORDS = ['aitmed', 'telemedicine', 'blockchain', 'noodl']
const FAVICON = 'public/favicon.ico'

const pkg = fs.readJsonSync('./package.json')
const nuiPkg = fs.readJsonSync('./packages/noodl-ui/package.json')
const ndomPkg = fs.readJsonSync('./packages/noodl-ui-dom/package.json')
const ntypesPkg = fs.readJsonSync('./packages/noodl-types/package.json')
const nutilsPkg = fs.readJsonSync('./packages/noodl-utils/package.json')

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

const filename = 'index.html'
const publicPath = path.join(process.cwd(), 'public')
const productionOptions = {}
const mode =
  process.env.NODE_ENV !== 'production' ? 'development' : 'production'
const ECOS_ENV = process.env.ECOS_ENV

if (mode === 'production') {
  /**
   * @type { webpack.Configuration['optimization'] }
   */
  productionOptions.optimization = {
    concatenateModules: true,
    mergeDuplicateChunks: true,
    minimize: true,
    nodeEnv: 'production',
    removeEmptyChunks: true,
    splitChunks: {
      chunks: 'async',
      minSize: 30000,
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
}

const commonHeaders = {
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
}

/** @type { import('webpack-dev-server').Configuration } */
const devServerOptions = {
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
  devMiddleware: {},
  host: '127.0.0.1',
  hot: true,
  liveReload: true,
  headers: commonHeaders,
  port: 3000,
  static: [publicPath],
  // watchFiles: './public/**/*',
  onBeforeSetupMiddleware({ app, server }) {
    //
  },
}

const environmentPluginOptions = {
  BUILD: {
    ecosEnv: ECOS_ENV,
    nodeEnv: mode,
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
  NODE_ENV: mode,
  USE_DEV_PATHS: !!process.env.USE_DEV_PATHS,
}

if (!u.isUnd(process.env.DEPLOYING)) {
  environmentPluginOptions.DEPLOYING =
    process.env.DEPLOYING === true || process.env.DEPLOYING === 'true'
      ? true
      : false
}

const environmentPlugin = new webpack.EnvironmentPlugin(
  environmentPluginOptions,
)

/**
 * @type { webpack.Configuration } webpackOptions
 */
module.exports = {
  entry: {
    main: [process.env.SAMPLE ? './src/sample.ts' : './src/index.ts'],
  },
  output: {
    clean: true,
    // Using content hash when "watching" makes webpack save assets which might increase memory usage
    filename: mode === 'production' ? '[name].[contenthash].js' : '[name].js',
    path: path.resolve(process.cwd(), 'build'),
  },
  mode,
  devServer: devServerOptions,
  devtool: 'inline-source-map',
  externals: [],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        include: path.resolve(process.cwd(), 'src'),
        use: [
          {
            loader: 'esbuild-loader',
            options: { loader: 'ts', target: 'es2020' },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        exclude: /\.module\.css$/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: ['node_modules'],
    fallback: {
      // crypto: require.resolve('crypto-browserify'),
      // stream: require.resolve('stream-browserify'),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({ process: 'process' }),
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      include: /(src)/,
    }),
    new webpack.ContextReplacementPlugin(
      /date\-fns[\/\\]/,
      new RegExp(`[/\\\\\](${['en-US'].join('|')})[/\\\\\]index\.js$`),
    ),
    environmentPlugin,
    new HtmlWebpackPlugin({
      alwaysWriteToDisk: true,
      filename,
      title: TITLE,
      favicon: FAVICON,
      cache: false,
      scriptLoading: 'defer',
      minify: true,
      //Austin Yu 8/5/2021 disable for stable build to use webpack generate index.html
      // ...(ecosEnv !== 'test' ? { template: 'public/index.html' } : undefined),
      meta: {
        description: DESCRIPTION,
        keywords: KEYWORDS.join(', '),
        viewport:
          'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no',
      },
    }),
    new HtmlWebpackHarddiskPlugin(),
    new InjectScriptsPlugin({
      path: 'public/libs.html',
    }),
    new InjectBodyPlugin({
      content: `<div id="root"></div>`,
      position: 'start',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'public/firebase-messaging-sw.js',
          to: 'firebase-messaging-sw.js',
        },
        { from: 'public/sql-wasm.wasm', to: 'sql-wasm.wasm' },
      ],
    }),
    new webpack.ProgressPlugin({
      handler: webpackProgress,
    }),
  ],
  ...productionOptions,
  optimization: {
    ...(productionOptions && productionOptions.optimization),
  },
}

const getEcosEnv = () =>
  ECOS_ENV ? ECOS_ENV.toUpperCase() : '<Variable not set>'

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
`Your app is being built for ${u.cyan(`eCOS`)} ${u.magenta(getEcosEnv())} environment in ${u.cyan(getNodeEnv())} mode\n
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

${mode === 'production'
    ? `An ${u.magenta(filename)} file will be generated inside your ${u.magenta('build')} directory. \nThe title of the page was set to ${u.yellow(TITLE)}`
    : ''
}\n\n`)
}
