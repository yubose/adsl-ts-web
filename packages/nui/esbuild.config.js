const u = require('@jsmanifest/utils')
const chalk = require('chalk')
const esbuild = require('esbuild')
const { nodeExternalsPlugin } = require('esbuild-node-externals')

const _DEV_ = process.env.NODE_ENV === 'development'
const tag = `[${u.cyan('nui')}]`

esbuild
  .build({
    allowOverwrite: true,
    bundle: true,
    color: true,
    entryPoints: ['./src/index.ts'],
    format: 'esm',
    minify: !_DEV_,
    outfile: 'dist/index.js',
    platform: 'node',
    plugins: [nodeExternalsPlugin()],
    sourcemap: true,
    target: 'node14',
    logLevel: 'debug',
    watch: _DEV_ && {
      onRebuild(err, res) {
        if (err) throw new Error(err)
        console.log(`${tag} Files rebuilt`, res)
      },
    },
  })
  .catch(() => process.exit(1))
