import { DEFAULT_EXTENSIONS } from '@babel/core'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import filesize from 'rollup-plugin-filesize'
import external from 'rollup-plugin-peer-deps-external'
import progress from 'rollup-plugin-progress'
import esbuild from 'rollup-plugin-esbuild'

const extensions = [...DEFAULT_EXTENSIONS, '.ts']
const _DEV_ = process.env.NODE_ENV === 'development'

/**
 * @typedef { import('rollup').RollupOptions[] }
 */
const configs = [
  {
    input: 'src/index.ts',
    output: [
      {
        dir: './dist',
        exports: 'named',
        format: 'umd',
        name: 'noodlui',
        globals: {
          'noodl-action-chain': 'nac',
          'noodl-types': 'nt',
          'noodl-utils': 'ntil',
          'lodash/get': '_get',
          'lodash/cloneDeep': '_cloneDeep',
          'lodash/has': '_has',
          'lodash/set': '_set',
          'lodash/merge': '_merge',
          invariant: 'invariant',
        },
        sourcemap: true,
      },
    ],
    plugins: [
      nodePolyfills(),
      external(),
      filesize(),
      progress(),
      nodeResolve({
        browser: true,
        extensions,
        moduleDirectories: ['node_modules'],
        preferBuiltins: false,
      }),
      esbuild({
        include: /\.[t]s?$/,
        exclude: /node_modules/,
        minify: !_DEV_,
        target: 'es2018',
        sourceMap: true,
        experimentalBundling: true,
      }),
    ],
  },
]

export default configs
