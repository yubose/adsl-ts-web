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
  }),
  new HtmlWebpackPlugin(htmlPluginOptions),
]

let productionOptions

if (process.env.NODE_ENV !== 'production') {
  //
} else {
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

if (productionOptions) {
  // console.log(
  //   `Your options for production are being applied: `,
  //   JSON.stringify(productionOptions, null, 2),
  // )
}

module.exports = {
  entry: './src/index.ts',
  output: {
    // filename: 'index.js',
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
      // {
      //   test: /\.(png|jpe?g|gif|svg)$/i,
      //   use: [{ loader: 'file-loader' }],
      // },
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
            process.env.ECOS_ENV.toUpperCase(),
          )} environment in ${chalk.yellow(
            process.env.NODE_ENV.toUpperCase(),
          )} mode`,
        )
        console.log(`Status:   ${chalk.blueBright(msg.toUpperCase())}`)
        console.log(`Progress: ${chalk.magenta(percentage.toFixed(4) * 100)}%`)
        console.log(`Modules:  ${chalk.magenta(args[0])}`)
        console.log('')
        console.log(`${chalk('eCOS packages')}:`)
        console.log(
          `${chalk.yellow(`@aitmed/cadl`)}:            ${chalk.magenta(
            pkg.dependencies['@aitmed/cadl'],
          )}`,
        )
        console.log(
          `${chalk.yellow(`@aitmed/ecos-lvl2-sdk`)}:   ${chalk.magenta(
            pkg.dependencies['@aitmed/ecos-lvl2-sdk'],
          )}`,
        )
        console.log(
          `${chalk.yellow(`noodl-ui`)}:                ${chalk.magenta(
            pkg.dependencies['noodl-ui'],
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
    // new webpack.SplitChunksPlugin(),
  ],
  ...productionOptions,
  optimization: {
    ...(productionOptions && productionOptions.optimization),
  },
}
