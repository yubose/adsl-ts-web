const chalk = require('chalk')
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const favicon = 'public/favicon.ico'
const filename = 'index.html'
const title = 'AiTmed Noodl Web'

module.exports = {
  entry: {
    main: './styleboard/index.ts',
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'sbuild'),
  },
  devServer: {
    contentBase: [path.join(__dirname, 'styleboard')],
    host: '127.0.0.1',
    port: 3000,
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
        include: path.resolve(__dirname, 'styleboard'),
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
    modules: [path.resolve(__dirname, 'styleboard'), 'node_modules'],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.ECOS_ENV': JSON.stringify(process.env.ECOS_ENV),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    new HtmlWebpackPlugin({
      filename,
      title,
      favicon,
      scriptLoading: 'defer',
      minify: false,
      ...(process.env.ECOS_ENV !== 'test'
        ? { template: 'styleboard/index.html' }
        : undefined),
    }),
    new webpack.ProgressPlugin({
      handler(percentage, msg, ...args) {
        console.clear()
        console.log('')
        console.log('')
        console.log('-------------------------------------------------------')
        console.log(`Your app is being built for ${chalk.yellow('eCOS')}`)
        console.log(`Status:   ${chalk.blueBright(msg.toUpperCase())}`)
        console.log(`Progress: ${chalk.magenta(percentage.toFixed(4) * 100)}%`)
        console.log('-------------------------------------------------------')
      },
    }),
  ],
}
