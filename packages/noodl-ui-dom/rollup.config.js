import nodePolyfills from 'rollup-plugin-node-polyfills'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import filesize from 'rollup-plugin-filesize'
import external from 'rollup-plugin-peer-deps-external'
import progress from 'rollup-plugin-progress'
import esbuild from 'rollup-plugin-esbuild'

const _DEV_ = process.env.NODE_ENV === 'development'
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
        name: 'ndom',
        sourcemap: 'inline-source-map',
        globals: {
          'noodl-ui': 'nui',
        },
      },
    ],
    external: ['noodl-ui'],
    plugins: [
      nodePolyfills(),
      external(),
      commonjs(),
      filesize(),
      progress(),
      resolve({
        browser: true,
        extensions: ['.js', '.ts'],
        moduleDirectories: ['node_modules'],
        preferBuiltins: false,
      }),
      esbuild({
        include: /\.[t]s?$/,
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
