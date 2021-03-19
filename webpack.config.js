const path = require('path')
const chalk = require('chalk')
const webpack = require('webpack')
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

const favicon = 'public/favicon.ico'
const filename = 'index.html'
const title = 'AiTmed Noodl Web'
const productionOptions = {}

if (process.env.NODE_ENV === 'production') {
  productionOptions.optimization = {
    // minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: 4,
        sourceMap: true,
      }),
    ],
    splitChunks: {
      chunks: 'async',
      minSize: 20000,
      maxSize: 0,
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
    filename: '[name].[hash].js',
    path: path.resolve(__dirname, 'build'),
  },
  devServer: {
    clientLogLevel: 'info',
    compress: false,
    contentBase: [path.join(__dirname, 'public')],
    hot: false,
    host: '127.0.0.1',
    liveReload: true,
    port: 3000,
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
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
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
      ...(process.env.ECOS_ENV !== 'test'
        ? { template: 'public/index.html' }
        : undefined),
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
        console.clear()
        console.log('')
        console.log('')
        console.log('-------------------------------------------------------')
        console.log(
          `Your app is being built for ${chalk.yellow('eCOS')} ${chalk.magenta(
            process.env.ECOS_ENV
              ? process.env.ECOS_ENV.toUpperCase()
              : '<Variable not set>',
          )} environment in ${chalk.yellow(
            process.env.NODE_ENV
              ? process.env.NODE_ENV.toUpperCase()
              : '<Variable not set>',
          )} mode`,
        )
        console.log(`Status:   ${chalk.blueBright(msg.toUpperCase())}`)
        console.log(`Progress: ${chalk.magenta(percentage.toFixed(4) * 100)}%`)
        console.log(`File:  ${chalk.magenta(args[0])}`)
        console.log('')
        console.log(`${chalk('eCOS packages')}:`)
        console.log(
          `${chalk.yellow(`@aitmed/cadl`)}:            ${chalk.magenta(
            pkg.dependencies['@aitmed/cadl'] ||
              pkg.devDependencies['@aitmed/cadl'],
          )}`,
        )
        console.log(
          `${chalk.yellow(`@aitmed/ecos-lvl2-sdk`)}:   ${chalk.magenta(
            pkg.dependencies['@aitmed/ecos-lvl2-sdk'] ||
              pkg.devDependencies['@aitmed/ecos-lvl2-sdk'],
          )}`,
        )
        console.log(
          `${chalk.yellow(`noodl-ui`)}:                ${chalk.magenta(
            pkg.dependencies['noodl-ui'],
          )}`,
        )
        console.log(
          `${chalk.yellow(`noodl-ui-dom`)}:            ${chalk.magenta(
            pkg.dependencies['noodl-ui-dom'],
          )}`,
        )
        if (process.env.NODE_ENV === 'production') {
          console.log('')
          console.log(
            `An ${chalk.magenta(
              filename,
            )} file will be generated inside your ${chalk.magenta(
              'build',
            )} directory.`,
          )
          console.log(
            `The title of the page was set to "${chalk.yellow(title)}"`,
          )
        }
        console.log('-------------------------------------------------------')
      },
    }),
  ],
  ...productionOptions,
  optimization: {
    ...(productionOptions && productionOptions.optimization),
  },
}
