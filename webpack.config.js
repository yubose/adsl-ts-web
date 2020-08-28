const path = require('path')
const webpack = require('webpack')
const { BundleStatsWebpackPlugin } = require('bundle-stats-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CircularDependencyPlugin = require('circular-dependency-plugin')
// const MiniCssExtractPlugin = require('mini-css-extract-plugin')

console.log('-------------------------------------------')
console.log(`   NODE_ENV set to ${process.env.NODE_ENV}`)
console.log(`   ECOS_ENV set to ${process.env.ECOS_ENV}`)
console.log('-------------------------------------------')
console.log('')

module.exports = {
  entry: './src/index.ts',
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
  devtool: 'source-map',
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
              plugins: ['lodash', '@babel/plugin-transform-runtime'],
            },
          },
          {
            loader: 'ts-loader',
            options: {
              silent: true,
              transpileOnly: true,
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
              modules: true,
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
  output: {
    filename: 'index.js',
    // filename: '[name].[hash].js',
    path: path.resolve(__dirname, 'build'),
  },
  plugins: [
    new BundleStatsWebpackPlugin({
      baseline: true,
    }),
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      include: /src/,
    }),
    new webpack.EnvironmentPlugin({
      'process.env.ECOS_ENV': process.env.ECOS_ENV,
    }),
    // new MiniCssExtractPlugin({
    //   filename: 'styles.css',
    //   chunkFilename: '[id].css',
    // }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      title: 'AiTmed Web',
    }),
  ],
}
