const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

console.log('-------------------------------------------')
console.log(`   NODE_ENV set to ${process.env.NODE_ENV}`)
console.log(`   ECOS_ENV set to ${process.env.ECOS_ENV}`)
console.log('-------------------------------------------')
console.log('')

module.exports = {
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  devServer: {
    compress: true,
    contentBase: [
      path.join(__dirname, 'public'),
      path.join(__dirname, 'src', 'assets'),
    ],
    host: '127.0.0.1',
    port: 3000,
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          // Disable type checker - we will use it in fork plugin
          transpileOnly: true,
        },
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
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [{ loader: 'file-loader' }],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  output: {
    filename: '[name].[hash].js',
    path: path.resolve(__dirname, 'build'),
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      ECOS_ENV: process.env.ECOS_ENV,
    }),
    new ForkTsCheckerWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
      chunkFilename: '[id].css',
    }),
    new HtmlWebpackPlugin({
      // inject: false,
      // hash: false,
      // eslint: {
      //   enabled: true,
      //   files: "./src/**/*",
      // },
      filename: 'index.html',
      title: 'AiTmed Web',
    }),
  ],
}
