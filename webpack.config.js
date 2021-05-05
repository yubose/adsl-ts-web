// process.stdout.write('\x1Bc')
const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')
const webpack = require('webpack')
const singleLog = require('single-line-log')
const CircularDependencyPlugin = require('circular-dependency-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const InjectScriptsPlugin = require('./scripts/InjectScriptsPlugin')
const pkg = require('./package.json')
const noodluiPkg = require('./packages/noodl-ui/package.json')
const noodlutilsPkg = require('./packages/noodl-utils/package.json')
const noodluidomPkg = require('./packages/noodl-ui-dom/package.json')

const { blueBright, magenta, yellow, italic } = chalk

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
      // {
      //   test: /\.css$/,
      //   use: [
      //     'style-loader',
      //     {
      //       loader: 'css-loader',
      //       options: {
      //         importLoaders: 1,
      //         modules: false,
      //       },
      //     },
      //   ],
      //   include: /\.module\.css$/,
      // },
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
      // 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.USE_DEV_PATHS': JSON.stringify(process.env.USE_DEV_PATHS),
      'process.env.BUILD': JSON.stringify({
        ecosEnv: process.env.ECOS_ENV,
        nodeEnv: process.env.NODE_ENV,
        packages: {
          '@aitmed/cadl': noodlSdkVersion,
          '@aitmed/ecos-lvl2-sdk': ecosSdkVersion,
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
