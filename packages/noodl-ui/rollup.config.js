import { DEFAULT_EXTENSIONS } from '@babel/core'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import filesize from 'rollup-plugin-filesize'
import external from 'rollup-plugin-peer-deps-external'
import progress from 'rollup-plugin-progress'
import babel from '@rollup/plugin-babel'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

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
      commonjs(),
      filesize(),
      progress(),
      nodeResolve({
        browser: true,
        extensions,
        moduleDirectories: ['node_modules'],
        preferBuiltins: false,
      }),
      typescript({
        rollupCommonJSResolveHack: true,
        check: false,
        abortOnError: false,
        clean: true,
      }),
      babel({
        babelHelpers: 'runtime',
        include: ['src/**/*'],
        exclude: ['node_modules/**/*'],
        extensions: ['.js'],
        plugins: [
          'babel-plugin-lodash',
          '@babel/plugin-transform-runtime',
          '@babel/plugin-proposal-optional-chaining',
        ],
      }),
      !_DEV_
        ? terser({
            compress: {
              drop_console: false,
              drop_debugger: false,
            },
            keep_fnames: true,
            format: {
              source_map: { includeSources: true },
            },
          })
        : undefined,
      // esbuild({
      //   include: /\.[jt]s?$/,
      //   exclude: /node_modules/,
      //   minify: process.env.NODE_ENV === 'production',
      //   target: 'es2015',
      //   loaders: {
      //     '.ts': 'ts',
      //   },
      //   sourceMap: true,
      // }),
    ],
  },
]

export default configs
