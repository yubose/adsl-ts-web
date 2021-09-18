const meow = require('meow')
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const InjectBodyPlugin = require('inject-body-webpack-plugin').default

const cli = meow('', { flags: { sample: { alias: 's', type: 'string' } } })

const filename = 'index.html'
const publicPath = path.join(__dirname, 'sample')
const title = 'Sample'
const mode =
  process.env.NODE_ENV !== 'production' ? 'development' : 'production'
const ECOS_ENV = process.env.ECOS_ENV

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
    'https://127.0.0.1',
    'https://127.0.0.1:3000',
    'aitmed.com',
    'aitmed.io',
  ],
  clientLogLevel: 'info',
  compress: false,
  contentBase: [publicPath],
  host: '127.0.0.1',
  // hot: true,
  // liveReload: true,
  headers: commonHeaders,
  // after(app, server, compiler) {
  //   app.use((req, resp, next) => {
  //     console.log({ headers: req.headers, path: app.path, params: app.param })
  //     setHeadersOnResp(resp)
  //     next()
  //   })
  // },
  // http2: true,
  // https: {
  //   ca: fs.readFileSync(path.resolve(path.join(__dirname, './dev/key.pem'))),
  //   cert: fs.readFileSync(path.resolve(path.join(__dirname, './dev/cert.pem'))),
  //   key: fs.readFileSync(path.resolve(path.join(__dirname, './dev/key.pem'))),
  // },
  overlay: true,
  stats: { chunks: true },
  historyApiFallback: true,
}

/**
 * @type { webpack.Configuration } webpackOptions
 */
module.exports = {
  entry: {
    main: ['./sample/index.ts'],
  },
  output: {
    clean: true,
    path: path.resolve(__dirname, 'dist'),
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
        include: path.resolve(__dirname, 'src'),
        use: [
          {
            loader: 'esbuild-loader',
            options: { loader: 'ts', target: 'es2016' },
          },
        ],
      },
      // {
      //   test: /\.css$/,
      //   use: ['style-loader', 'css-loader'],
      //   exclude: /\.module\.css$/,
      // },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: ['node_modules'],
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      ECOS_ENV,
      NODE_ENV: mode,
    }),
    new HtmlWebpackPlugin({
      alwaysWriteToDisk: true,
      filename,
      title,
    }),
    new HtmlWebpackHarddiskPlugin(),
    new InjectBodyPlugin({
      content: `<div id="root"></div>`,
      position: 'start',
    }),
  ],
}
