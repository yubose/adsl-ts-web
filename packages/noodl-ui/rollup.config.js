import resolve from '@rollup/plugin-node-resolve'
import filesize from 'rollup-plugin-filesize'
import progress from 'rollup-plugin-progress'
import commonjs from '@rollup/plugin-commonjs'
import esbuild from 'rollup-plugin-esbuild'
import external from 'rollup-plugin-peer-deps-external'

const extensions = ['.js', '.ts']
const _DEV_ = process.env.NODE_ENV === 'development'

/**
 * @type { import('rollup').RollupOptions[] }
 */
const configs = [
  {
    input: 'src/index.ts',
    output: [
      {
        dir: './dist',
        exports: 'named',
        format: 'umd',
        name: 'nui',
        sourcemap: true,
      },
    ],
    context: 'window',
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
        include: /\.ts$/,
        exclude: /node_modules/,
        minify: !_DEV_,
        minifyIdentifiers: false,
        target: 'es2018',
      }),
    ],
  },
]

// "presets": ["@babel/env"],
// "plugins": ["@babel/plugin-transform-runtime"]

export default configs
