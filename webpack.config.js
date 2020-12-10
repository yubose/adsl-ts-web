const path = require('path')
const chalk = require('chalk')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const pkg = require('./package.json')
const logsnapPkg = require('./packages/logsnap/package.json')
const noodluiPkg = require('./packages/noodl-ui/package.json')
const noodlutilsPkg = require('./packages/noodl-utils/package.json')
const noodluidomPkg = require('./packages/noodl-ui-dom/package.json')
// const CircularDependencyPlugin = require('circular-dependency-plugin')
// const { BundleStatsWebpackPlugin } = require('bundle-stats-webpack-plugin')

const htmlPluginOptions = {
  filename: 'index.html',
  title: 'AiTmed Noodl Web',
  favicon: 'favicon.ico',
  template: process.env.ECOS_ENV !== 'test' ? 'public/index.html' : undefined,
  cache: false,
  scriptLoading: 'defer',
  minify: false,
}

const plugins = [
  // new BundleStatsWebpackPlugin({
  //   baseline: true,
  // }),
  // new CircularDependencyPlugin({
  //   exclude: /node_modules/,
  //   include: /src/,
  // }),
  new webpack.DefinePlugin({
    'process.env.ECOS_ENV': JSON.stringify(process.env.ECOS_ENV),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.USE_DEV_PATHS': JSON.stringify(process.env.USE_DEV_PATHS),
    'process.env.BUILD': JSON.stringify({
      ecosEnv: process.env.ECOS_ENV,
      nodeEnv: process.env.NODE_ENV,
      packages: {
        '@aitmed/cadl': pkg.devDependencies['@aitmed/cadl'],
        '@aitmed/ecos-lvl2-sdk': pkg.devDependencies['@aitmed/ecos-lvl2-sdk'],
        'noodl-ui': noodluiPkg.version,
        'noodl-utils': noodlutilsPkg.version,
        'noodl-ui-dom': noodluidomPkg.version,
        logsnap: logsnapPkg.version,
        typescript: pkg.devDependencies.typescript,
        'twilio-video': pkg.devDependencies['twilio-video'],
      },
      timestamp: new Date().toLocaleString(),
    }),
  }),
  new HtmlWebpackPlugin(htmlPluginOptions),
]

let productionOptions

if (process.env.NODE_ENV === 'production') {
  productionOptions = {
    optimization: {
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
    },
  }
}

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: '[name].[hash].js',
    path: path.resolve(__dirname, 'build'),
  },
  devServer: {
    compress: false,
    contentBase: [
      path.join(__dirname, 'public'),
      path.join(__dirname, 'src', 'assets'),
    ],
    host: '127.0.0.1',
    hot: true,
    port: 3000,
  },
  devtool: 'inline-source-map',
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
    ...plugins,
    new webpack.ProgressPlugin({
      handler(percentage, msg, ...args) {
        console.clear()
        console.info('')
        console.info('')
        console.info('-------------------------------------------------------')
        console.info(
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
        console.info(`Status:   ${chalk.blueBright(msg.toUpperCase())}`)
        console.info(`Progress: ${chalk.magenta(percentage.toFixed(4) * 100)}%`)
        console.info(`File:  ${chalk.magenta(args[0])}`)
        console.info('')
        console.info(`${chalk('eCOS packages')}:`)
        console.info(
          `${chalk.yellow(`@aitmed/cadl`)}:            ${chalk.magenta(
            pkg.dependencies['@aitmed/cadl'] ||
              pkg.devDependencies['@aitmed/cadl'],
          )}`,
        )
        console.info(
          `${chalk.yellow(`@aitmed/ecos-lvl2-sdk`)}:   ${chalk.magenta(
            pkg.dependencies['@aitmed/ecos-lvl2-sdk'] ||
              pkg.devDependencies['@aitmed/ecos-lvl2-sdk'],
          )}`,
        )
        console.info(
          `${chalk.yellow(`noodl-ui`)}:                ${chalk.magenta(
            pkg.dependencies['noodl-ui'],
          )}`,
        )
        console.info(
          `${chalk.yellow(`noodl-ui-dom`)}:            ${chalk.magenta(
            pkg.dependencies['noodl-ui-dom'],
          )}`,
        )
        if (process.env.NODE_ENV === 'production') {
          console.info('')
          console.info(
            `An ${chalk.magenta(
              htmlPluginOptions.filename,
            )} file will be generated inside your ${chalk.magenta(
              'build',
            )} directory.`,
          )
          console.info(
            `The title of the page was set to "${chalk.yellow(
              htmlPluginOptions.title,
            )}"`,
          )
        }
        console.info('-------------------------------------------------------')
      },
    }),
  ],
  ...productionOptions,
  optimization: {
    ...(productionOptions && productionOptions.optimization),
  },
}
