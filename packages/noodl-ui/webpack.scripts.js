const path = require('path')
const webpack = require('webpack')

const baseDir = path.resolve(__dirname, '_dev_')
const compiledDir = path.resolve(baseDir, 'compiled')

module.exports = {
  entry: path.resolve(baseDir, 'scripts/scripts.ts'),
  target: 'node',
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
    modules: [path.resolve(__dirname, '_dev_'), 'node_modules'],
  },
  output: {
    filename: 'index.js',
    path: compiledDir,
  },
  plugins: [
    new webpack.WatchIgnorePlugin([/\.js$/, /\.json$/, /\.d\.ts$/, /compiled/]),
  ],
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
