const axios = require('axios').default
const u = require('@jsmanifest/utils')
const fs = require('fs-extra')
const path = require('path')

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

function getConfigUrl(configKey = '') {
  return `https://public.aitmed.com/config/${ensureExt(configKey, 'yml')}`
}

function configDirExists(baseDir, configKey) {
  return fs.existsSync(getConfigDir(configKey))
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

function getConfigDir(configKey, cwd = process.cwd()) {
  return path.join(cwd, 'output', removeExt(configKey, 'yml'))
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
  normalizePath,
  removeExt,
  regex,
}

module.exports = utils
