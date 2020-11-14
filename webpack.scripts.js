const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const baseDir = path.join(__dirname, 'scripts')
const compiledDir = path.join(baseDir, 'compiled')

let devServer
let entry = 'index.ts'
const presets = ['@babel/preset-env']
const plugins = [
  new webpack.WatchIgnorePlugin([/\.js$/, /\.json$/, /\.d\.ts$/, /compiled/]),
]

if (process.env.FILE === 'mockWebpage.ts') {
  devServer = {
    compress: false,
    contentBase: [
      path.join(__dirname, 'scripts/compiled'),
      path.join(__dirname, 'src', 'assets'),
    ],
    host: '127.0.0.1',
    hot: true,
    port: 3000,
  }
  entry = process.env.FILE
  presets.push('@babel/preset-typescript')
  plugins.push(
    new HtmlWebpackPlugin({
      filename: 'index.html',
      title: 'Mock/testing',
      favicon: 'favicon.ico',
      cache: true,
      minify: false,
    }),
  )
}

module.exports = {
  entry: path.join(baseDir, entry),
  target: 'node',
  devServer,
  devtool: 'inline-source-map',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /(node_modules)/,
        use: [
          {
            loader: 'babel-loader',
            // options: {
            //   presets,
            //   plugins: [
            //     'lodash',
            //     '@babel/plugin-transform-runtime',
            //     ['@babel/plugin-proposal-class-properties', { loose: true }],
            //     ['@babel/plugin-proposal-private-methods', { loose: true }],
            //   ],
            // },
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: 'tsconfig.scripts.json',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [path.resolve(__dirname, 'scripts'), 'node_modules'],
  },
  output: {
    filename: 'index.js',
    path: compiledDir,
  },
  plugins,
  externals: [],
  optimization: {
    // splitChunks: {
    //   cacheGroups: {
    //     commons: {
    //       name: 'commons',
    //       chunks: 'initial',
    //       minChunks: 2,
    //     },
    //   },
    // },
  },
}
