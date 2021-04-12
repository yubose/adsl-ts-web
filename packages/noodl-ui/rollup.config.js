import { DEFAULT_EXTENSIONS } from '@babel/core'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import babel from '@rollup/plugin-babel'
import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import filesize from 'rollup-plugin-filesize'
import external from 'rollup-plugin-peer-deps-external'
import progress from 'rollup-plugin-progress'
// import { terser } from 'rollup-plugin-terser'

const extensions = [...DEFAULT_EXTENSIONS, '.ts']

const configs = [
  {
    input: 'src/index.ts',
    output: [
      {
        dir: 'dist',
        exports: 'named',
        format: 'umd',
        name: 'noodlui',
        sourcemap: true,
        globals: {},
      },
      // {
      //   dir: 'dist',
      //   format: 'es',
      //   preserveModules: false,
      //   sourcemap: true,
      // },
    ],
    plugins: [
      nodePolyfills(),
      external(),
      commonjs(),
      filesize(),
      progress(),
      resolve({
        extensions,
        moduleDirectories: ['node_modules'],
      }),
      typescript({
        rollupCommonJSResolveHack: true,
        check: false,
        abortOnError: false,
        clean: true,
      }),
      // Env var set by root lerna repo
      // ...(process.env.NODE_ENV !== 'development' ? [terser()] : []),s,
      babel({
        babelHelpers: 'runtime',
        include: ['src/**/*'],
        exclude: ['node_modules/**'],
        extensions,
      }),
    ],
  },
]

export default configs
