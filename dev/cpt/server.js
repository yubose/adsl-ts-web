process.stdout.write('\x1Bc')
const fs = require('fs-extra')
const path = require('path')
const u = require('@jsmanifest/utils')
const y = require('yaml')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const host = '127.0.0.1'
const port = 3000
const pathToDataSourceDir = path.join(
  __dirname,
  '../../generated/provider/dataSource',
)
const pathToCptFile = path.join(pathToDataSourceDir, 'CPT_shrinked.yml')
// const pathToCptFile = path.join(pathToDataSourceDir, 'CPT.yml')
const pathToCptModFile = path.join(pathToDataSourceDir, 'CPTMod.yml')

const cptYml = fs.readFileSync(pathToCptFile, 'utf8')
// const cptModYml = fs.readFileSync(pathToCptModFile, 'utf8')

/**
 * @typedef CptContent
 * @type { Record<string, string> }
 */

const cptData = y.parse(cptYml)
const cptContent = cptData.CPT.content
const cptContentVersion = cptData.CPT.version

const compiler = webpack({
  entry: path.join(__dirname, './index.ts'),
  output: {
    clean: true,
    filename: 'index.js',
    // path: path.join(__dirname, './dist'),
  },
  devtool: false,
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        exclude: /\.module\.css$/,
      },
      {
        test: /\.(js|ts)?$/,
        exclude: /node_modules/,
        include: path.join(__dirname),
        use: [
          {
            loader: 'esbuild-loader',
            options: { loader: 'ts', target: 'es2017' },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: './index.html',
      publicPath: __dirname,
      template: './index.html',
    }),
    new CopyPlugin({
      patterns: [{ from: 'dist/piWorker.js', to: 'piWorker.js' }],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js'],
  },
})

const devServer = new WebpackDevServer(
  {
    compress: true,
    host,
    port,
    setupMiddlewares(middlewares, server) {
      server.app.get('/cpt', (req, res) => {
        res.json(cptData)
      })
      return middlewares
    },
  },
  compiler,
)

devServer.startCallback((err) => {
  if (err) {
    console.error(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
  } else {
    // console.log(stats)
    console.log(`${u.cyan(`Server listening at http://${host}:${port}`)}`)
  }
})
