import path from 'path'
import fg from 'fast-glob'
import {
  ensureDirSync,
  existsSync,
  readFileSync as originalReadFileSync,
  readJsonSync as originalReadJsonSync,
  writeFileSync as originalWriteFileSync,
  writeJsonSync,
} from 'fs-extra'
import { fp, is } from '@noodl/core'
import { parse as parseYml } from './yml'

/**
 * @param { string } filepath
 * @param { object } [opts]
 * @param { any } [opts.defaultValue]
 * @param { 'json' | 'html' } [opts.type]
 */
export function ensureFile(
  filepath = '',
  { defaultValue = '', type = 'json' } = {},
) {
  ensureDirSync(path.parse(filepath).dir)
  if (!existsSync(filepath)) {
    if (typeof defaultValue === 'string' || defaultValue == null) {
      writeFileSync(filepath, defaultValue, 'utf8')
    } else if (typeof defaultValue === 'object') {
      writeJsonSync(filepath, defaultValue, { spaces: 2 })
    }
  }
  if (type === 'json') {
    const file = readFileSync(filepath)
    if (file === '') writeJsonSync(filepath, {})
    return readJsonSync(filepath)
  }
  return readFileSync(filepath)
}

/**
 * Ensures that the string ends with ext
 * @param { string } str
 * @param { string } ext
 * @returns { string }
 */
export function ensureExt(str: string, ext: string) {
  if (str && ext) {
    if (!ext.startsWith('.')) ext = `.${ext}`
    if (!str.endsWith(ext)) return `${str}${ext}`
    if (str.endsWith('.')) return `${str}${ext.substring(1)}`
  }
  return str
}

/**
 * Returns the path as an absolute path
 * @param { string[] } paths
 * @returns { string }
 */
export function getAbsFilePath(...paths: string[]) {
  const filepath = normalizePath(...paths)
  if (path.isAbsolute(filepath)) return filepath
  return path.resolve(normalizePath(process.cwd(), ...paths))
}

/**
 * Returns the file name from the file path (including the ext)
 * Supply a 2nd parameter to remove the ext (ex: '.tsx)
 * @param { string } str
 * @param { string } ext
 * @returns { string }
 */
export function getFileName(str: string | undefined = '', ext?: string) {
  if (!ext) return path.basename(str)
  return path.basename(str, ext.startsWith('.') ? ext : `.${ext}`)
}

/**
 * Takes in a filepath and returns a new object mapping filepaths to their belonging collection according to the noodl specification
 *
 * @example
 * ```js
 * const noodlCollections = mapFilesToNoodlCollections('path-to-directory')
 * console.log(noodlCollection) // Result: { assets, rootConfig, appConfig, preload, pages }
 * ```
 *
 * @param { string } configKey
 * @param { string } dir
 */
export function mapFilesToNoodlCollections(
  configKey: string,
  dir: string,
  {
    includeWithPages,
  }: {
    includeWithPages?: string | string[]
  } = {},
) {
  const results = {
    assets: {
      path: '',
      files: [] as string[],
    },
    rootConfig: '' as string | Error,
    appConfig: '' as string | Error,
    preload: [] as string[],
    pages: [] as string[],
  }

  let appKey = ''
  let pathToRootConfigFile = path.join(dir, ensureExt(configKey, 'yml'))
  let pathToAppConfigFile = ''
  let preloadPages = [] as string[]
  let preloadPagesRegex: RegExp
  let preloadToIncludeWithPagesRegex = includeWithPages
    ? new RegExp(fp.toArr(includeWithPages).join('|'), 'i')
    : (false as false)

  if (!existsSync(pathToRootConfigFile)) {
    results.rootConfig = new Error(`The config "${configKey}" does not exist`)
  } else {
    results.rootConfig = pathToRootConfigFile
    const rootConfigYml = readFileSync(pathToRootConfigFile)
    const rootConfig = parseYml('object', rootConfigYml)
    appKey = rootConfig.cadlMain || 'cadlEndpoint.yml'
    pathToAppConfigFile = path.join(dir, ensureExt(appKey, 'yml'))
  }

  if (!existsSync(pathToAppConfigFile)) {
    results.appConfig = new Error(`The app config "${appKey}" does not exist`)
  } else {
    results.appConfig = pathToAppConfigFile
    const appConfigYml = readFileSync(pathToAppConfigFile)
    const appConfig = parseYml('object', appConfigYml)
    if (appConfig.preload) {
      preloadPages = fp.toArr(appConfig.preload)
      preloadPagesRegex = new RegExp(preloadPages.join('|'), 'i')
    }
  }

  const matchedEntries = fg.sync([path.join(dir, '**/*')], {
    objectMode: true,
    onlyFiles: false,
  })

  matchedEntries.forEach(({ dirent, name: filename, path: filepath }) => {
    if (dirent.isDirectory()) {
      if (filename === 'assets') {
        results.assets.path = filepath
      } else {
        // TODO
        console.error(
          `[dirent.isDirectory] encountered non-assets directory: ${filepath}`,
        )
      }
    } else {
      const extname = path.extname(filepath)
      const name = filename.replace(extname, '')
      if (filepath.includes('/assets/')) {
        results.assets.files.push(filepath)
      } else {
        if (/\.?yml$/i.test(extname)) {
          if (preloadPagesRegex.test(name)) {
            results.preload.push(filepath)
            if (
              preloadToIncludeWithPagesRegex &&
              preloadToIncludeWithPagesRegex.test(name)
            ) {
              results.pages.push(filepath)
            }
          } else {
            results.pages.push(filepath)
          }
        } else {
        }
      }
    }
  })

  return results
}

/**
 * Normalizes the path (compatible with win).
 * Useful for globs to work expectedly
 * @param s String paths
 * @returns { string }
 */
export function normalizePath(...s: string[]) {
  let result = (s.length > 1 ? path.join(...s) : s[0]).replace(/\\/g, '/')
  if (result.includes('/~/')) result = result.replace('~/', '')
  return result
}

/**
 *  Removes extension from the string if it exists
 * @param { string } str
 * @param { string } ext
 * @returns { string }
 */
export function removeExt(str: string, ext: string) {
  if (str) {
    if (ext.startsWith('.')) {
      if (str.endsWith(ext)) return str.replace(ext, '')
      ext = ext.substring(1)
    }
    if (str.endsWith(`.${ext}`)) return str.replace(`.${ext}`, '')
  }
  return str
}

/**
 * Reads a file from the filesystem
 * @param { string } path
 * @param { string | object } [opts]
 * @returns { string }
 */
export function readFileSync(
  path: string,
  opts?: BufferEncoding | { encoding?: BufferEncoding; flags?: string },
) {
  return originalReadFileSync(path, {
    encoding: (is.str(opts) ? opts : opts?.encoding) || 'utf8',
    flag: is.obj(opts) ? opts.flags : undefined,
  })
}

export function readJsonSync(path: string) {
  return originalReadJsonSync(path)
}

/**
 * Writes a file to the filesystem
 * @param s String paths
 * @returns { string }
 */
export function writeFileSync(
  path: string,
  data: any,
  encoding: BufferEncoding = 'utf8',
) {
  originalWriteFileSync(path, data, encoding)
}
