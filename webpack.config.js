const u = require('@jsmanifest/utils')
const path = require('path')
const webpack = require('webpack')
const singleLog = require('single-line-log').stdout
const CircularDependencyPlugin = require('circular-dependency-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const InjectScriptsPlugin = require('./scripts/InjectScriptsPlugin')

const pkgJson = {
  root: require('./package.json'),
  nui: require('./packages/noodl-ui/package.json'),
  ndom: require('./packages/noodl-ui-dom/package.json'),
  nutil: require('./packages/noodl-utils/package.json'),
}

const version = {
  noodlSdk: pkgJson.root.devDependencies['@aitmed/cadl'],
  ecosSdk: pkgJson.root.devDependencies['@aitmed/ecos-lvl2-sdk'],
  nui: pkgJson.nui.version,
  ndom: pkgJson.ndom.version,
  nutil: pkgJson.ndom.version,
  nTypes: pkgJson.root.dependencies['noodl-types'],
}

const favicon = 'public/favicon.ico'
const filename = 'index.html'
const publicPath = path.join(__dirname, 'public')
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
  contentBase: [publicPath],
  host: '127.0.0.1',
  hot: true,
  liveReload: true,
}

const environmentPlugin = new webpack.EnvironmentPlugin({
  BUILD: {
    ecosEnv: process.env.ECOS_ENV,
    nodeEnv: process.env.NODE_ENV,
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
  ECOS_ENV: process.env.ECOS_ENV,
  NODE_ENV: process.env.NODE_ENV,
  USE_DEV_PATHS: process.env.USE_DEV_PATHS,
})

let ecosEnv = environmentPlugin.defaultValues.ECOS_ENV
let nodeEnv = environmentPlugin.defaultValues.NODE_ENV

if (!u.isUnd(process.env['DEPLOYING'])) {
  const value = process.env['DEPLOYING']
  environmentPlugin.defaultValues['DEPLOYING'] = value
  if (!environmentPlugin.keys.includes(value)) {
    environmentPlugin.keys.push(value)
  }
}

/**
 * @type { webpack.Configuration } webpackOptions
 */
module.exports = {
  entry: {
    main: ['./src/index.ts'],
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'build'),
  },
  mode: process.env.NODE_ENV !== 'production' ? 'development' : 'production',
  devServer: devServerOptions,
  devtool: 'inline-source-map',
  externals: [],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        include: path.resolve(__dirname, 'src'),
        use: [
          {
            loader: 'esbuild-loader',
            options: { loader: 'ts', target: 'es2016' },
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
      // handler: webpackProgress,
    }),
  ],
  ...productionOptions,
  optimization: {
    ...(productionOptions && productionOptions.optimization),
  },
}

const getEcosEnv = () =>
  ecosEnv ? ecosEnv.toUpperCase() : '<Variable not set>'

const getNodeEnv = () =>
  nodeEnv ? nodeEnv.toUpperCase() : '<Variable not set>'

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

${nodeEnv === 'production' 
    ? `An ${u.magenta(filename)} file will be generated inside your ${u.magenta('build')} directory. \nThe title of the page was set to ${u.yellow(title)}` 
    : ''
}\n\n`)
}
