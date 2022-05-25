process.stdout.write('\x1Bc')
const fs = require('fs-extra')
const path = require('path')
const u = require('@jsmanifest/utils')
const y = require('yaml')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const meow = require('meow')

const cli = meow('', {
  flags: {},
})

const { flags } = cli

const host = '127.0.0.1'
const port = 3000
const entryPoint = path.join(process.cwd(), './dev/sampleWebServer/index.ts')
const publicPath = path.join(process.cwd(), './dev/sampleWebServer/dist')

const compiler = webpack([
  {
    entry: entryPoint,
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
    output: {
      clean: true,
      filename: 'index.js',
      path: publicPath,
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        showErrors: true,
      }),
      new webpack.ProvidePlugin({ process: 'process' }),
    ],
    resolve: {
      alias: {
        fs: path.resolve(path.join(process.cwd(), './node_modules/fs-extra')),
      },
      extensions: ['.ts', '.js'],
      fallback: {
        assert: false,
        constants: require.resolve('constants-browserify'),
        crypto: require.resolve('crypto-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        path: require.resolve('path-browserify'),
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        worker_threads: false,
        zlib: require.resolve('browserify-zlib'),
      },
    },
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
