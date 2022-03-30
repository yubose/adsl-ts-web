/**
 * Rollup configuration is for the noodl background worker
 */
const path = require('path')
const resolve = require('@rollup/plugin-node-resolve').default
const filesize = require('rollup-plugin-filesize')
const progress = require('rollup-plugin-progress')
const commonjs = require('@rollup/plugin-commonjs')
const esbuild = require('rollup-plugin-esbuild').default

console.log('HEY')

/**
 * @type { import('rollup').RollupOptions }
 */
const config = {
  input: 'src/index.ts',
  output: {
    file: path.join(__dirname, './dist/index.js'),
    exports: 'named',
    format: 'umd',
    name: 'noodlPi',
    sourcemap: true,
  },
  context: 'this',
  plugins: [
    resolve({
      extensions: ['.ts', '.js'],
    }),
    commonjs({ extensions: ['.js'] }),
    filesize(),
    progress(),
    esbuild({
      include: /\.(ts)$/,
      exclude: /node_modules/,
      minify: process.env.NODE_ENV === 'production',
      minifyIdentifiers: false,
      target: 'es2015',
      loaders: {
        ts: 'ts',
      },
    }),
  ],
}

module.exports = config
