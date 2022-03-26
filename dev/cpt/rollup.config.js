/**
 * Rollup configuration is for the noodl background worker
 */
import resolve from '@rollup/plugin-node-resolve'
import filesize from 'rollup-plugin-filesize'
import progress from 'rollup-plugin-progress'
import commonjs from '@rollup/plugin-commonjs'
import esbuild from 'rollup-plugin-esbuild'
import external from 'rollup-plugin-peer-deps-external'

const extensions = ['.js', '.ts']

/**
 * @type { import('rollup').RollupOptions[] }
 */
const configs = [
  {
    input: 'piWorker.ts',
    output: [
      {
        file: './dist/piWorker.js',
        exports: 'named',
        format: 'umd',
        name: 'noodlPiWorker',
        sourcemap: true,
      },
    ],
    context: 'this',
    plugins: [
      resolve({
        extensions,
        preferBuiltins: true,
      }),
      commonjs({
        sourceMap: false,
      }),
      filesize(),
      progress(),
      external({
        includeDependencies: true,
      }),
      esbuild({
        include: /\.(js|ts)$/,
        exclude: /node_modules/,
        minify: process.env.NODE_ENV === 'production',
        minifyIdentifiers: false,
        target: 'es2015',
        loaders: {
          ts: 'ts',
        },
      }),
    ],
  },
]

// "presets": ["@babel/env"],
// "plugins": ["@babel/plugin-transform-runtime"]

export default configs
