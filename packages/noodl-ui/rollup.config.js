import { nodeResolve } from '@rollup/plugin-node-resolve'
import filesize from 'rollup-plugin-filesize'
import progress from 'rollup-plugin-progress'
import commonjs from '@rollup/plugin-commonjs'
import esbuild from 'rollup-plugin-esbuild'

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
    plugins: [
      commonjs(),
      filesize(),
      progress(),
      nodeResolve({
        browser: true,
        extensions,
        moduleDirectories: ['node_modules'],
      }),
      esbuild({
        include: /\.[jt]s?$/,
        exclude: /node_modules/,
        minify: !_DEV_,
        minifyIdentifiers: false,
        target: 'es2018',
        sourceMap: true,
      }),
    ],
  },
]

export default configs
