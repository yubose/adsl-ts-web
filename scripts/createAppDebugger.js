/**
 * Hooks onto the web app's dev server to start a live auto reload development session for a noodl directory
 */
const chalk = require('chalk')
const fs = require('fs-extra')
const fg = require('fast-glob')
const path = require('path')
const u = require('@jsmanifest/utils')
const createWatcher = require('./watch')
const createWss = require('./wss')

/**
 * @param { object } [options]
 * @param { string } [options.app]
 * @param { string } [options.basedir]
 * @param { import('webpack-dev-server/types/lib/Server') } [options.devServer]
 * @param { Record<string, any> } env
 * @param { import('chokidar').WatchOptions } [options.watcherOptions]
 * @param { import('ws').ServerOptions } [options.wssOptions]
 */
function createAppDebugger({
  app,
  basedir,
  devServer,
  env,
  watcherOptions,
  wssOptions,
} = {}) {
  const aqua = chalk.keyword('aquamarine')
  const coolGold = chalk.keyword('navajowhite')
  const log = console.log
  const wss = createWss({
    host: '127.0.0.1',
    serializeError: _serializeError,
    ...wssOptions,
  })
  const watcher = createWatcher({
    basedir,
    cwd: basedir,
    glob: '**/*',
    ...watcherOptions,
    on: {
      ready: (_, __, watchCount) => {
        log(`${watcher.tag} Watching ${u.yellow(watchCount)} files`)
      },
      add: (args) => wss.emit(args),
      addDir: (args) => wss.emit(args),
      change: (args) => wss.emit(args),
      unlink: (args) => wss.emit(args),
      unlinkDir: (args) => wss.emit(args),
      error({ error }) {
        const err = _serializeError(error)
        log(u.yellow(`[${err.name}] ${u.red(err.message)}`))
      },
    },
  })

  function _findMatchingFileName(filepaths, n) {
    return filepaths.find((fp) => fp.includes(n))
  }

  function _getRouteFilePath(r, ext = '') {
    return path.join(basedir, r + (ext ? `.${ext}` : ''))
  }

  /**
   * @param { unknown } error
   */
  function _serializeError(error) {
    return {
      code: error?.code,
      name: error?.name,
      message: error?.message,
    }
  }

  return {
    start() {
      try {
        devServer?.app?.get(`/assets/:filename`, (req, res) => {
          let { filename } = req.params
          log(`Requesting asset: ${coolGold(filename)}`)
          const filepath = path.join(basedir, 'assets', filename)
          log(`Filepath: ${coolGold(filepath)}`)
          if (filepath) res.sendFile(filepath)
          else res.status(500).json({ error: `File "${filename}" not found` })
        })

        devServer?.app?.get(`/:appname/:filename`, (req, res, next) => {
          let { filename } = req.params
          log(`Requesting file: ${aqua(filename)}`)
          if (filename.includes('_en')) filename = filename.replace('_en', '')
          if (filename.endsWith('.yml')) filename = filename.replace('.yml', '')
          log(`Formatted filename: ${u.yellow(filename)}`)
          const glob = '**/*.yml'
          log(`Glob: ${u.yellow(glob)}`)
          const filepaths = fg.sync(glob, { cwd: basedir })
          log(`Finding within ${u.yellow(filepaths.length)} possible matches`)
          const filepath = _findMatchingFileName(filepaths, filename)
          log(`Matching filepath: ${u.yellow(filepath)}`)
          const fileyml = loadAsYml(filepath)
          if (!fileyml) return next()
          res.status(200).json(fileyml)
        })

        if (!fs.existsSync(basedir)) {
          throw new Error(`The directory ${u.yellow(basedir)} does not exist`)
        }

        devServer?.app?.get(`/info`, (req, res) => {
          res.status(200).json({
            mode: devServer.app.settings?.env,
            basedir,
            configKey: app,
            env,
            watcher: {
              ...watcher.metadata,
              options: watcher.client.options,
              watchedFiles: watcher.client.getWatched(),
            },
            wss: {
              clients: Array.from(wss.server.clients).map((client) => ({
                isClosed: client?.readyState === client.CLOSED,
                isClosing: client?.readyState === client.CLOSING,
                isConnecting: client?.readyState === client.CONNECTING,
                isOpened: client?.readyState === client.OPEN,
                buffered: client?.bufferedAmount,
              })),
              args: wssOptions,
              address: wss.server.address().address,
              path: wss.server.path,
              port: wss.server.address().port,
            },
          })
        })

        const routeFilePaths = [
          {
            name: app,
            path: _getRouteFilePath(app, 'yml'),
            ext: '.yml',
          },
          {
            name: 'cadlEndpoint',
            path: _getRouteFilePath('cadlEndpoint', 'yml'),
            ext: '.yml',
          },
        ]

        const filepaths = fg.sync('**/*', {
          cwd: basedir,
          onlyFiles: true,
        })

        log(`${u.yellow(filepaths.length)} routes matched}`)

        filepaths.forEach((filepath) => {
          filepath = path.join(basedir, filepath)
          log(`${u.yellow(filepath)}`)
          const routeObject = {
            name: path
              .basename(filepath, path.extname(filepath))
              .replace(/_en/, ''),
            path: filepath,
            ext: path.extname(filepath),
          }
          log(routeObject)
          routeFilePaths.push(routeObject)
          if (!fs.existsSync(routeObject.path)) {
            log(
              `${u.red(`The file at`)} ${u.yellow(filepath)} ${u.red(
                `does not exist`,
              )}`,
            )
          }
        })

        log(`Registering ${u.yellow(routeFilePaths.length)} routes`)

        routeFilePaths.forEach((obj) => {
          const trimmedName = obj.name.replace(/_en/, '')
          const route = obj.ext
            ? new RegExp(`(${trimmedName})(_en)?(${obj.ext})$`)
            : new RegExp(`${trimmedName}(_en)?`)
          log(`Registering route ${u.yellow(trimmedName)}`)
          log(obj)
          devServer.app.get(route, (req, res) => {
            res.status(200).sendFile(obj.path)
          })
        })

        return devServer
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        throw err
      }
    },
    watcher,
    wss,
  }
}

module.exports = createAppDebugger
