process.stdout.write('\x1Bc')
const u = require('@jsmanifest/utils')
const meow = require('meow')
const express = require('express')
const esbuild = require('esbuild')
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

esbuild.build({
  charset: 'utf8',
  entryPoints: ['src/worker.ts'],
  outfile: 'public/worker.js',
  sourcemap: 'inline',
  watch: true,
})

const startCmd = `${u.white(`npm run`)} ${u.yellow(`node start`)}`
const withArgs = (s) => `${u.magenta(s)}`

// prettier-ignore
const cli = meow(
  `
  ${u.white(`Usage`)}

  $ ${startCmd} Will use the config in src/app/noodl.ts
  $ ${startCmd} ${withArgs(`--config meet4d`)} Will use meet4d.yml config in test (the default) environment
  $ ${startCmd} ${withArgs(`-c testpage --env stable`)} Will use testpage.yml config in stable environment
  $ ${startCmd} ${withArgs(`-e stable`)} Will use the config in src/app/noodl.ts in stable environment
  $ ${startCmd} ${withArgs(`--config=meet2d --env test -p 3005`)} Will use port 3005 for the web app
  $ ${startCmd} ${withArgs(`--config=meet2d --env test --serverPort 8080`)} Will use port 8080 for the server serving noodl files
  
`,
  {
    flags: {
      config: { alias: 'c', type: 'string' },
      env: { alias: 'e', type: 'string', default: 'test' },
      port: { alias: 'p', type: 'number', default: 3000 },
      serverDir: {type:'string',default:'server'},
      serverPort: {  type: 'number', default: 3001 },
    },
  },
)

const webpackConfig = require('./webpack.config')
const nodeEnv = 'development'
const app = express()

/**
 * @typedef SettingsObject
 * @type { object } settings
 * @property { string } config
 * @property { string } env
 * @property { string } baseUrl
 * @property { object } paths
 * @property { string } paths.base
 * @property { string } paths.assets
 */

!webpackConfig.mode && (webpackConfig.mode = nodeEnv)
!u.isArr(webpackConfig.plugins) && (webpackConfig.plugins = [])

webpackConfig.plugins.unshift(
  new (require('noodl-webpack-plugin'))({
    config: cli.flags.config,
    env: cli.flags.env,
    hostname: '127.0.0.1',
    serverPath: cli.flags.serverDir,
    serverPort: cli.flags.serverPort,
  }),
)

const envPluginIndex = webpackConfig.plugins.findIndex(
  (plugin) => plugin instanceof webpack.EnvironmentPlugin,
)

if (envPluginIndex !== -1) {
  /** @type { webpack.EnvironmentPlugin } */
  const envPlugin = webpackConfig.plugins[envPluginIndex]
  const envValues = { ...envPlugin.defaultValues }

  envValues.BUILD.ecosEnv = cli.flags.env
  envValues.BUILD.nodeEnv = nodeEnv
  envValues.ECOS_ENV = cli.flags.env
  envValues.NODE_ENV = nodeEnv
  envValues.USE_DEV_PATHS = true

  webpackConfig.plugins.splice(
    envPluginIndex,
    1,
    new webpack.EnvironmentPlugin(envValues),
  )
}

webpackConfig.entry = [
  'webpack-hot-middleware/client?path=__webpack_hmr&reload=true',
  ...webpackConfig.entry.main,
]

webpackConfig.mode = nodeEnv
webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin())

u.newline()

const compiler = webpack(webpackConfig)

app.use(
  webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
  }),
)

app.use(webpackHotMiddleware(compiler))

app.listen(cli.flags.port)
