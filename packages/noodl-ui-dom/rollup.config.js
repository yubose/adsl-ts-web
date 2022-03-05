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
        dir: './dist',
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
      external({
        includeDependencies: true,
      }),
      commonjs({
        sourceMap: false,
      }),
      filesize(),
      progress(),
      resolve({
        extensions: ['.js', '.ts'],
        preferBuiltins: true,
      }),
      esbuild({
        include: /\.ts?$/,
        exclude: /node_modules/,
        minify: !_DEV_,
        minifyIdentifiers: false,
        target: 'es2018',
      }),
    ],
  },
]

export default configs
