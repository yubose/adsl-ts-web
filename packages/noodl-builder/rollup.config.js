import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import filesize from 'rollup-plugin-filesize'
import progress from 'rollup-plugin-progress'
import esbuild from 'rollup-plugin-esbuild'

const extensions = ['.js', '.ts']

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
        name: 'noodl-builder',
      },
    ],
    plugins: [
      resolve({ extensions }),
      commonjs(),
      filesize(),
      progress(),
      esbuild({
        include: /\.ts$/,
        exclude: /node_modules/,
        target: 'es2018',
      }),
    ],
  },
]

// "presets": ["@babel/env"],
// "plugins": ["@babel/plugin-transform-runtime"]

export default configs
