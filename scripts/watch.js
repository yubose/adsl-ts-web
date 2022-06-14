const chokidar = require('chokidar')
const fs = require('fs-extra')
const path = require('path')
const u = require('@jsmanifest/utils')

/**
 * @typedef CallbackFnArgs
 * @property { string } CallbackFnArgs.type
 * @property { boolean } CallbackFnArgs.isFile
 * @property { boolean } CallbackFnArgs.isDirectory
 * @property { string } CallbackFnArgs.name
 * @property { string } CallbackFnArgs.path
 */

/**
 * @typedef CallbackFn
 * @type { (args: CallbackFnArgs) => void }
 */

/**
 * @typedef On
 * @type { object }
 * @property { (watcher: chokidar.FSWatcher, watchedFiles: { dir: { files: string[] }}, watchCount: number) => void } [On.ready]
 * @property { CallbackFn } [On.add]
 * @property { CallbackFn } [On.addDir]
 * @property { CallbackFn } [On.change]
 * @property { (args: { type: string; error: Error }) => void } [On.error]
 * @property { CallbackFn } [On.unlink]
 * @property { CallbackFn } [On.unlinkDir]
 */

exports.ADD_DIR = 'ADD_DIR'
exports.ADD_FILE = 'ADD_FILE'
exports.DIR_REMOVED = 'DIR_REMOVED'
exports.FILE_CHANGED = 'FILE_CHANGED'
exports.FILE_REMOVED = 'FILE_REMOVED'
exports.WATCH_ERROR = 'WATCH_ERROR'

const tag = `[${u.blue('watch')}]`

/**
 * @param { chokidar.WatchOptions & { basedir: string; glob?: string; log?: Console['log']; on?: On } } [options]
 */
function createWatcher({
  basedir,
  cwd,
  glob: globProp,
  log = console.log,
  on,
  ...options
}) {
  let metadata = {
    cwd,
    filepathsSentToObservers: [],
  }
  /** @type chokidar.FSWatcher */
  let watcher
  let globs = [globProp || path.join(basedir, '**/*')]

  log(`${tag} Globs: ${u.yellow(globs.join(', '))}`)

  /**
   * @param { (args:{ isFile: boolean; isFolder: boolean; name: string; path: string }) => void } fn
   */
  function onWatchEvent(fn) {
    async function onEvent(filepath) {
      filepath = path.join(basedir, filepath)
      if (!metadata.filepathsSentToObservers.includes(filepath)) {
        metadata.filepathsSentToObservers.push(filepath)
      }
      const stats = await fs.stat(filepath)
      const pathObject = path.parse(filepath)
      return fn({
        isFile: stats.isFile(),
        isFolder: stats.isDirectory(),
        name: pathObject.name,
        path: filepath,
      })
    }
    return onEvent
  }

  watcher = chokidar.watch(globs, {
    ignoreInitial: false,
    ignorePermissionErrors: true,
    cwd,
    ...options,
  })

  watcher
    .on('ready', () => {
      const watchedFiles = watcher?.getWatched()
      const watchCount = watchedFiles
        ? u
            .values(watchedFiles)
            .reduce((count, files) => (count += files.length || 0), 0)
        : 0
      on?.ready?.(watcher, watchedFiles, watchCount)
    })
    .on(
      'add',
      onWatchEvent((args) => on?.add({ type: exports.ADD_FILE, ...args })),
    )
    .on(
      'addDir',
      onWatchEvent((args) => on?.addDir?.({ type: exports.ADD_DIR, ...args })),
    )
    .on(
      'change',
      onWatchEvent((args) =>
        on?.change?.({ type: exports.FILE_CHANGED, ...args }),
      ),
    )
    .on('error', (err) =>
      on?.error?.({ type: exports.WATCH_ERROR, error: err }),
    )
    .on('unlink', (filepath) =>
      on?.unlink?.({ type: exports.FILE_REMOVED, filepath }),
    )
    .on('unlinkDir', (dir) =>
      on?.unlinkDir?.({ type: exports.DIR_REMOVED, dir }),
    )

  return {
    get client() {
      return watcher
    },
    globs,
    metadata,
    tag,
    watcher,
  }
}

module.exports = createWatcher
