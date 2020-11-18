import { DEFAULT_EXTENSIONS } from '@babel/core'
// import babel from '@rollup/plugin-babel'
import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import filesize from 'rollup-plugin-filesize'
import external from 'rollup-plugin-peer-deps-external'
import progress from 'rollup-plugin-progress'
// import { terser } from 'rollup-plugin-terser'

const extensions = [...DEFAULT_EXTENSIONS, '.ts']

const config = {
  input: 'src/noodl-building-blocks.ts',
  output: [
    {
      dir: 'dist',
      exports: 'named',
      format: 'umd',
      name: 'noodlui',
      sourcemap: true,
      globals: {
        // noodlutils: ['noodl-utils'],
      },
    },
  ],
  plugins: [
    external(),
    commonjs(),
    filesize(),
    progress(),
    resolve({
      extensions,
      customResolveOptions: {
        moduleDirectory: ['node_modules'],
      },
    }),
    typescript({
      rollupCommonJSResolveHack: true,
      check: false,
      abortOnError: false,
      clean: true,
    }),
    // babel({
    //   babelHelpers: 'runtime',
    //   include: ['src/**/*'],
    //   exclude: ['node_modules'],
    //   extensions,
    // }),
    // Env var set by root lerna repo
    // ...(process.env.NODE_ENV !== 'development' ? [terser()] : []),
  ],
}

export default config
