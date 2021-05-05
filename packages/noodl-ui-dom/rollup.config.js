import { DEFAULT_EXTENSIONS } from '@babel/core'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import filesize from 'rollup-plugin-filesize'
import external from 'rollup-plugin-peer-deps-external'
import progress from 'rollup-plugin-progress'
import babel from '@rollup/plugin-babel'
import typescript from 'rollup-plugin-typescript2'

const extensions = [...DEFAULT_EXTENSIONS, '.ts']

/**
 * @typedef { RollupOptions[] }
 */
const configs = [
  {
    input: 'src/index.ts',
    output: [
      {
        dir: 'dist',
        exports: 'named',
        format: 'umd',
        name: 'noodluidom',
        sourcemap: 'inline-source-map',
        globals: {
          'noodl-ui': 'noodlui',
        },
      },
    ],
    plugins: [
      nodePolyfills(),
      external(),
      commonjs(),
      filesize(),
      progress(),
      resolve({
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
        extensions,
        presets: ['@babel/env', '@babel/preset-typescript'],
        plugins: ['@babel/plugin-transform-runtime'],
      }),
      // Env var set by root lerna repo
      // ...(process.env.NODE_ENV !== 'development' ? [terser()] : []),
    ],
  },
]

export default configs
