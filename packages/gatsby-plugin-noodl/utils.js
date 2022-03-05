const axios = require('axios').default
const u = require('@jsmanifest/utils')
const fs = require('fs-extra')
const path = require('path')

const getRelPath = (baseDir, ...s) => path.join(baseDir, ...s)

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

const utils = {
  configDirExists,
  downloadFile,
  ensureExt,
  fetchYml,
  getAssetFilePath,
  getConfigDir,
  getConfigUrl,
  removeExt,
  fontSize: {
    '10px': '0.625rem',
    '11px': '0.6875rem',
    '12px': '0.75rem',
    '13px': '0.8125rem',
    '14px': '0.875rem',
    '15px': '0.9375rem',
    '16px': '1rem',
    '17px': '1.0625rem',
    '18px': '1.125rem',
    '19px': '1.1875rem',
    '20px': '1.25rem',
    '21px': '1.3125rem',
    '22px': '1.375rem',
    '23px': '1.4375rem',
    '24px': '1.5rem',
    '25px': '1.5625rem',
    '26px': '1.625rem',
    '27px': '1.6875rem',
    '28px': '1.75rem',
    '29px': '1.8125rem',
    '30px': '1.875rem',
    '31px': '1.9375rem',
    '32px': '2rem',
    '33px': '2.0625rem',
    '34px': '2.125rem',
    '35px': '2.1875rem',
    '36px': '2.25rem',
    '37px': '2.3125rem',
    '38px': '2.375rem',
    '39px': '2.4375rem',
    '40px': '2.5rem',
    '41px': '2.5625rem',
    '42px': '2.625rem',
    '43px': '2.6875rem',
    '44px': '2.75rem',
    '45px': '2.8125rem',
    '46px': '2.875rem',
    '47px': '2.9375rem',
    '48px': '3rem',
    '49px': '3.0625rem',
    '50px': '3.125rem',
    '51px': '3.1875rem',
    '52px': '3.25rem',
    '53px': '3.3125rem',
    '54px': '3.375rem',
    '55px': '3.4375rem',
    '56px': '3.5rem',
    '57px': '3.5625rem',
    '58px': '3.625rem',
    '59px': '3.6875rem',
    '60px': '3.75rem',
    '61px': '3.8125rem',
    '62px': '3.875rem',
    '63px': '3.9375rem',
    '64px': '4rem',
  },
  getConfigVersion(config, env = 'stable') {
    return config?.web?.cadlVersion?.[env]
  },
  makeTraverser,
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
