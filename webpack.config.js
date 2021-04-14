console.clear()
const path = require('path')
const chalk = require('chalk')
const webpack = require('webpack')
const singleLog = require('single-line-log')
const CircularDependencyPlugin = require('circular-dependency-plugin')
const CopyPlugin = require('copy-webpack-plugin')
// const { BundleStatsWebpackPlugin } = require('bundle-stats-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const InjectScriptsPlugin = require('./scripts/InjectScriptsPlugin')
const pkg = require('./package.json')
const noodluiPkg = require('./packages/noodl-ui/package.json')
const noodlutilsPkg = require('./packages/noodl-utils/package.json')
const noodluidomPkg = require('./packages/noodl-ui-dom/package.json')

const { blueBright, magenta, yellow } = chalk

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
  productionOptions.optimization = {
    // minimize: true,
    minimizer: [new TerserPlugin({ parallel: 4 })],
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

module.exports = {
  entry: {
    main: './src/index.ts',
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'build'),
  },
  devServer: {
    clientLogLevel: 'info',
    compress: false,
    contentBase: [path.join(__dirname, 'public')],
    hot: false,
    // host: '127.0.0.1',
    liveReload: true,
    // port: 3000,
    before: function (app, server, compiler) {
      app.get('/debug', (req, res) => {
        res.json({ hello: 'EH?' })
      })
    },
  },
  devtool: 'source-map',
  watchOptions: {
    ignored: /node_modules/,
  },
  externals: [],
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        include: path.resolve(__dirname, 'src'),
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: [
                'lodash',
                '@babel/plugin-transform-runtime',
                ['@babel/plugin-proposal-class-properties', { loose: true }],
                ['@babel/plugin-proposal-private-methods', { loose: true }],
              ],
            },
          },
          {
            loader: 'ts-loader',
            options: {
              silent: true,
              transpileOnly: true,
              allowTsInNodeModules: false,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: false,
            },
          },
        ],
        include: /\.module\.css$/,
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
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  plugins: [
    new webpack.ProvidePlugin({ process: 'process' }),
    // new BundleStatsWebpackPlugin({
    //   baseline: true,
    // }),
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
      // 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.USE_DEV_PATHS': JSON.stringify(process.env.USE_DEV_PATHS),
      'process.env.BUILD': JSON.stringify({
        ecosEnv: process.env.ECOS_ENV,
        nodeEnv: process.env.NODE_ENV,
        packages: {
          '@aitmed/cadl': pkg.dependencies['@aitmed/cadl'],
          '@aitmed/ecos-lvl2-sdk': pkg.dependencies['@aitmed/ecos-lvl2-sdk'],
          'noodl-types': pkg.dependencies['noodl-types'],
          'noodl-ui': noodluiPkg.version,
          'noodl-utils': noodlutilsPkg.version,
          'noodl-ui-dom': noodluidomPkg.version,
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
    new InjectScriptsPlugin(),
    new CopyPlugin({
      patterns: [
        {
          from: 'public/firebase-messaging-sw.js',
          to: 'firebase-messaging-sw.js',
        },
      ],
    }),
    new webpack.ProgressPlugin({
      handler(percentage, msg, ...args) {
        // prettier-ignore
        singleLog.stdout(`
----------------------------------------------------------------------------------------------------
  Your app is being built for ${yellow(`eCOS`)} ${magenta(ecos)} environment in ${yellow(env)} mode
  Status:    ${blueBright(msg.toUpperCase())}
  File:      ${magenta(args[0])}
  Progress:  ${magenta(percentage.toFixed(4) * 100)}%
  ${blueBright('eCOS packages')}:
  ${yellow(`@aitmed/cadl`)}:            ${magenta(noodlSdkVersion)}
  ${yellow(`@aitmed/ecos-lvl2-sdk`)}:   ${magenta(ecosSdkVersion)}
  ${yellow(`noodl-ui`)}:                ${magenta(nuiVersion)}
  ${yellow(`noodl-ui-dom`)}:            ${magenta(ndomVersion)}
  ${nodeEnv === 'production' && `
  A "${magenta(filename)}" file will be generated inside your ${magenta('build')} directory.
  The title of the page was set to "${yellow(title)}"`})
----------------------------------------------------------------------------------------------------`)
      },
    }),
  ],
  ...productionOptions,
  optimization: {
    ...(productionOptions && productionOptions.optimization),
  },
}
