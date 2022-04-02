process.stdout.write('\x1Bc')
const fs = require('fs-extra')
const path = require('path')
const u = require('@jsmanifest/utils')
const y = require('yaml')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const meow = require('meow')

const cli = meow('', {
  flags: {
    worker: { alias: 'w', type: 'boolean' },
  },
})

const { flags } = cli

if (flags.worker) {
  require('execa').command(
    `lerna exec --scope noodl-pi "npm run types -- -w"`,
    { shell: true, stdio: 'inherit' },
  )
}

const host = '127.0.0.1'
const port = 3000
const pathToDataSourceDir = path.join(__dirname, './data')
const pathToCptFile = path.join(pathToDataSourceDir, 'CPT_shrinked.yml')
// const pathToCptFile = path.join(pathToDataSourceDir, 'CPT.yml')
const pathToCptModFile = path.join(pathToDataSourceDir, 'CPTMod.yml')
const publicPath = path.join(__dirname, './dist')
const cptYml = fs.readFileSync(pathToCptFile, 'utf8')
// const cptModYml = fs.readFileSync(pathToCptModFile, 'utf8')

/**
 * @typedef CptContent
 * @type { Record<string, string> }
 */

const cptData = y.parse(cptYml)
const cptContent = cptData.CPT.content
const cptContentVersion = cptData.CPT.version

/** @type { import('webpack').Configuration } */
const commonWebpackConfig = {
  devtool: 'source-map',
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
            options: { loader: 'ts', target: 'es2017', sourcemap: 'inline' },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
}

const compiler = webpack([
  {
    ...commonWebpackConfig,
    entry: path.join(__dirname, './piWorker.ts'),
    devtool: 'source-map',
    output: {
      clean: true,
      filename: 'piWorker.js',
      path: publicPath,
      // workerChunkLoadin
    },
  },
  {
    ...commonWebpackConfig,
    entry: path.join(__dirname, './index.ts'),
    devtool: 'source-map',
    output: {
      clean: true,
      filename: 'index.js',
      path: publicPath,
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: './index.html',
        showErrors: true,
        template: './index.html',
      }),
      new CopyPlugin({
        patterns: [
          { from: 'jsstoreWorker.min.js', to: 'jsstoreWorker.min.js' },
          { from: 'styles.css', to: 'styles.css' },
        ],
      }),
    ],
  },
])

const devServer = new WebpackDevServer(
  {
    compress: true,
    devMiddleware: {
      writeToDisk: true,
    },
    host,
    port,
    setupMiddlewares(middlewares, server) {
      server.app.get('/cpt', (req, res) => {
        res.json(cptData)
      })
      return middlewares
    },
    static: {
      directory: 'dist',
    },
  },
  compiler,
)

devServer.startCallback((err) => {
  if (err) {
    console.error(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
  } else {
    console.log(`${u.cyan(`Server listening at http://${host}:${port}`)}`)
  }
})
