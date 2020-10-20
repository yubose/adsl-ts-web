const path = require('path')
const chalk = require('chalk')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const pkg = require('./package.json')
// const CircularDependencyPlugin = require('circular-dependency-plugin')
// const { BundleStatsWebpackPlugin } = require('bundle-stats-webpack-plugin')

const htmlPluginOptions = {
  filename: 'index.html',
  title: 'AiTmed Web',
  cache: true,
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
  }),
  new HtmlWebpackPlugin(htmlPluginOptions),
]

let productionOptions

if (process.env.NODE_ENV === 'production') {
  productionOptions = {
    optimization: {
      minimize: true,
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
              htmlPluginOptions.filename,
            )} file will be generated inside your ${chalk.magenta(
              'build',
            )} directory.`,
          )
          console.log(
            `The title of the page was set to "${chalk.yellow(
              htmlPluginOptions.title,
            )}"`,
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
