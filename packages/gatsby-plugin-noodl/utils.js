const axios = require('axios').default
const u = require('@jsmanifest/utils')
const fs = require('fs-extra')
const path = require('path')

/**
 * @typedef NuiComponentInstance
 * @type { import('noodl-ui').NuiComponent.Instance }
 */

const getRelPath = (baseDir, ...s) => path.join(baseDir, ...s)
/**
 * Replaces backlashes for windows support
 * @param { string } s
 * @returns { string }
 */
const normalizePath = (s) => s.replace(/\\/g, '/')

const regex = {
  cadlBaseUrlPlaceholder: /\${cadlBaseUrl}/,
  cadlVersionPlaceholder: /\${cadlVersion}/,
  designSuffixPlaceholder: /\${designSuffix}/,
}

async function downloadFile(log, url, filename, dir) {
  try {
    const destination = path.join(dir, filename)
    const { data } = await axios.get(url, { responseType: 'text' })
    await fs.writeFile(destination, data, 'utf8')
    return data
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    // log.error(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        log.warn(`The file "${url}" returned a ${u.red(`404 Not Found`)} error`)
      }
    } else {
      throw err
    }
  }
}

/**
 * @param { (key: string, value: any, parent: Record<string, any>, path: string[]) => void } cb
 */
function makeTraverser(cb) {
  /**
   * @param { import('noodl-types').ComponentObject } bp
   * @param { string[] } [componentPath]
   */
  return function traverse(bp, componentPath = []) {
    if (u.isObj(bp)) {
      const entries = u.entries(bp)
      const numEntries = entries.length
      for (let index = 0; index < numEntries; index++) {
        const [key, value] = entries[index]
        const nextPath = componentPath.concat(key)
        cb(key, value, bp, nextPath)
        traverse(value, nextPath)
      }
    } else if (u.isArr(bp)) {
      bp.forEach((b, i) => traverse(b, componentPath.concat(i)))
    }
  }
}

function getConfigUrl(configKey = '') {
  return `https://public.aitmed.com/config/${ensureExt(configKey, 'yml')}`
}

/**
 *
 * @param { string } iteratorVar
 * @param { import('noodl-types').ComponentObject } component
 */
function getListObjectMapping(iteratorVar, component, path = []) {
  const mapping = {}

  /**
   * @param { Record<string, any> } obj
   */
  const mapProps = (obj, prefix = '', path = []) => {
    if (!u.isObj(obj)) return {}
    const mapped = {}

    for (const [key, value] of u.entries(obj)) {
      if (u.isStr(value) && value.startsWith(iteratorVar)) {
        if (prefix) path = path.concat(prefix)
        const currPath = path.concat(key).join('.')
        mapped[currPath] = {
          key,
          path: currPath,
          ref: value,
        }
      }
    }

    return mapped
  }

  if (iteratorVar && component) {
    u.assign(mapping, mapProps(u.omit(component, 'style'), '', path))
    u.assign(mapping, mapProps(component?.style, 'style', path))
  }

  component?.children?.forEach?.((child, index) =>
    u.assign(
      mapping,
      getListObjectMapping(iteratorVar, child, path.concat('children', index)),
    ),
  )

  return mapping
}

function configDirExists(baseDir, configKey) {
  return fs.existsSync(getConfigDir(baseDir, configKey))
}

function ensureExt(value = '', ext = 'yml') {
  if (!u.isStr(value)) return value
  if (value === '') return `.${ext}`
  if (value.endsWith(`.${ext}`)) return value
  if (value.endsWith('.')) return `${value}${ext}`
  return `${value}.${ext}`
}

/**
 * @param { string } url
 * @returns { Promise<string> }
 */
async function fetchYml(url = '') {
  return axios.get(url).then((resp) => resp.data)
}

function removeExt(str, ext = 'yml') {
  return path.basename(str, `.${ext}`)
}

function getAssetFilePath(srcPath, filename) {
  return path.join(srcPath, `./${filename}`)
}

function getConfigDir(baseDir, configKey) {
  return getRelPath(baseDir, removeExt(configKey, 'yml'))
}

/**
 * @param { NuiComponentInstance } parent
 * @param { NuiComponentInstance } child
 */
function getPathToParent(parent, child) {
  const _path = []
  let currParent = child
  while (currParent != null && currParent !== parent) {
    currParent = currParent.parent
    const index = currParent?.children?.indexOf?.(child)
    if (u.isNum(index) && index > -1) {
      _path.push('children', index)
    }
    currParent = currParent.parent
  }
  return _path
}

const utils = {
  configDirExists,
  downloadFile,
  ensureExt,
  fetchYml,
  getAssetFilePath,
  getConfigDir,
  getConfigUrl,
  getConfigVersion: (config, env = 'stable') => config?.web?.cadlVersion?.[env],
  getListObjectMapping,
  getPathToParent,
  normalizePath,
  makeTraverser,
  removeExt,
  regex,
  /**
   * @argument { Record<'cadlBaseUrl' | 'cadlVersion' | 'designSuffix', string> } options
   * @argument { any } value
   */
  replaceNoodlPlaceholders(options, value = '') {
    const { cadlBaseUrl = '', cadlVersion = '', designSuffix = '' } = options

    if (u.isStr(value)) {
      if (cadlBaseUrl && regex.cadlBaseUrlPlaceholder.test(value)) {
        value = value.replace(regex.cadlBaseUrlPlaceholder, cadlBaseUrl)
      }
      if (cadlVersion && regex.cadlVersionPlaceholder.test(value)) {
        value = value.replace(regex.cadlVersionPlaceholder, cadlVersion)
      }
      if (designSuffix) {
        if (
          u.isStr(designSuffix) &&
          regex.designSuffixPlaceholder.test(value)
        ) {
          value = value.replace(regex.designSuffixPlaceholder, designSuffix)
        } else if (u.isObj(designSuffix)) {
          value = ''
        }
      }
    } else if (u.isArr(value)) {
      return value.map((v) => this.replaceNoodlPlaceholders(options, v))
    } else if (u.isObj(value)) {
      return u.entries(value).reduce((acc, [k, v]) => {
        acc[k] = this.replaceNoodlPlaceholders(options, v)
        return acc
      }, {})
    }

    return value
  },
}

module.exports = utils
