const u = require('@jsmanifest/utils')
const path = require('path')
const webpack = require('webpack')
const singleLog = require('single-line-log').stdout
const CircularDependencyPlugin = require('circular-dependency-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const InjectScriptsPlugin = require('./scripts/InjectScriptsPlugin')
// const NoodlWebpackPlugin = require('noodl-webpack-plugin').default
const pkg = require('./package.json')
const nuiPkg = require('./packages/noodl-ui/package.json')
const ntilPkg = require('./packages/noodl-utils/package.json')
const ndomPkg = require('./packages/noodl-ui-dom/package.json')

const localPackages = {
  nui: {
    path: `./packages/noodl-ui/package.json`,
    version: '',
  },
  ndom: `./packages/noodl-ui-dom/package.json`,
  ntil: `./packages/noodl-utils/package.json`,
}

const noodlSdkVersion = pkg.devDependencies['@aitmed/cadl']
const ecosSdkVersion = pkg.devDependencies['@aitmed/ecos-lvl2-sdk']
const nuiVersion = pkg.dependencies['noodl-ui']
const ndomVersion = pkg.dependencies['noodl-ui-dom']

const ecosEnv = process.env.ECOS_ENV
const nodeEnv = process.env.NODE_ENV
const ecos = ecosEnv ? ecosEnv.toUpperCase() : '<Variable not set>'
const env = nodeEnv ? nodeEnv.toUpperCase() : '<Variable not set>'

const favicon = 'public/favicon.ico'
const filename = 'index.html'
const title = 'AiTmed Noodl Web'
const productionOptions = {}

if (process.env.NODE_ENV === 'production') {
  /**
   * @type { webpack.Configuration['optimization'] }
   */
  productionOptions.optimization = {
    // minimize: true,
    splitChunks: {
      chunks: 'async',
      minSize: 20000,
      maxSize: 50000,
      minChunks: 1,
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
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  }
}

/** @type { import('webpack-dev-server').Configuration } */
const devServerOptions = {
  clientLogLevel: 'info',
  compress: false,
  contentBase: [path.join(__dirname, 'public')],
  host: '127.0.0.1',
  hot: false,
  liveReload: true,
}

/**
 * @type { webpack.Configuration } webpackOptions
 */
module.exports = {
  entry: {
    main: './src/index.ts',
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'build'),
  },
  devServer: devServerOptions,
  devtool: 'inline-source-map',
  // externals: [],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        include: path.resolve(__dirname, 'src'),
        use: [
          {
            loader: 'esbuild-loader',
            options: {
              loader: 'ts', // Or 'ts' if you don't need tsx
              target: 'es2016',
            },
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
    extensions: ['.ts', '.js', '.mjs'],
    modules: ['node_modules'],
  },
  plugins: [
    // new NoodlWebpackPlugin({
    //   config: 'meet4d',
    //   hostname: '127.0.0.1',
    //   serverPort: 3001,
    //   serverPath: 'server',
    // }),
    new webpack.ProvidePlugin({ process: 'process' }),
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      include: /src/,
    }),
    new webpack.ContextReplacementPlugin(
      /date\-fns[\/\\]/,
      new RegExp(`[/\\\\\](${['en-US'].join('|')})[/\\\\\]index\.js$`),
    ),
    new webpack.DefinePlugin({
      // if process.env.DEPLOYING === true, this forces the config url in
      // src/app/noodl.ts to point to the public.aitmed.com host
      'process.env.DEPLOYING': JSON.stringify(process.env.DEPLOYING),
      'process.env.ECOS_ENV': JSON.stringify(process.env.ECOS_ENV),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.USE_DEV_PATHS': JSON.stringify(process.env.USE_DEV_PATHS),
      'process.env.BUILD': JSON.stringify({
        ecosEnv: process.env.ECOS_ENV,
        nodeEnv: process.env.NODE_ENV,
        packages: {
          '@aitmed/cadl': noodlSdkVersion,
          '@aitmed/ecos-lvl2-sdk': ecosSdkVersion,
          'noodl-types': pkg.dependencies['noodl-types'],
          'noodl-ui': nuiPkg.version,
          'noodl-utils': ntilPkg.version,
          'noodl-ui-dom': ndomPkg.version,
          typescript: pkg.devDependencies.typescript,
          'twilio-video': pkg.devDependencies['twilio-video'],
        },
        timestamp: new Date().toLocaleString(),
      }),
    }),
    new HtmlWebpackPlugin({
      filename,
      title,
      favicon,
      cache: false,
      scriptLoading: 'defer',
      minify: false,
      ...(ecosEnv !== 'test' ? { template: 'public/index.html' } : undefined),
    }),
    new InjectScriptsPlugin({
      path: 'public/libs.html',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'public/firebase-messaging-sw.js',
          to: 'firebase-messaging-sw.js',
        },
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

/**
 * @param { number } percentage
 * @param { string } msg
 * @param { ...string } args
 */
function webpackProgress(percentage, msg, ...args) {
  process.stdout.write('\x1Bc')
  // prettier-ignore
  singleLog(
`Your app is being built for ${u.yellow(`eCOS`)} ${u.magenta(ecos)} environment in ${u.yellow(env)} mode
Status:    ${u.blue(msg.toUpperCase())}
File:      ${u.magenta(args[0])}
Progress:  ${u.magenta(percentage.toFixed(4) * 100)}%
${u.blue('eCOS packages')}:
${u.yellow(`@aitmed/cadl`)}:            ${u.magenta(noodlSdkVersion)}
${u.yellow(`@aitmed/ecos-lvl2-sdk`)}:   ${u.magenta(ecosSdkVersion)}
${u.yellow(`noodl-ui`)}:                ${u.magenta(nuiVersion)}
${u.yellow(`noodl-ui-dom`)}:            ${u.magenta(ndomVersion)}
${nodeEnv === 'production' && `
A "${u.magenta(filename)}" file will be generated inside your ${u.magenta('build')} directory.
The title of the page was set to "${u.yellow(title)}"`})`)
}
