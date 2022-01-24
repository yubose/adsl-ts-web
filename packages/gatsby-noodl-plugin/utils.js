const u = require('@jsmanifest/utils')

const regex = {
  cadlBaseUrlPlaceholder: /\\${cadlBaseUrl}/,
  cadlVersionPlaceholder: /\\${cadlVersion}/,
  designSuffixPlaceholder: /\\${designSuffix}/,
}

exports.regex = regex

function getConfigVersion(config, env = 'stable') {
  return config?.web?.cadlVersion?.[env]
}

exports.getConfigVersion = getConfigVersion

/**
 * @argument { Record<'cadlBaseUrl' | 'cadlVersion' | 'designSuffix', string> } options
 * @argument { any } value
 */
function replaceNoodlPlaceholders(options, value = '') {
  const { cadlBaseUrl = '', cadlVersion = '', designSuffix = '' } = options

  if (u.isStr(value)) {
    if (cadlBaseUrl && regex.cadlBaseUrlPlaceholder.test(cadlBaseUrl)) {
      value = value.replace(regex.cadlBaseUrlPlaceholder, cadlBaseUrl)
    }
    if (cadlVersion && regex.cadlVersionPlaceholder.test(cadlVersion)) {
      value = value.replace(regex.cadlVersionPlaceholder, cadlVersion)
    }
    if (designSuffix) {
      if (
        u.isStr(designSuffix) &&
        regex.designSuffixPlaceholder.test(designSuffix)
      ) {
        value = value.replace(regex.designSuffixPlaceholder, designSuffix)
      } else if (u.isObj(designSuffix)) {
        value = ''
      }
    }
  } else if (u.isArr(value)) {
    return value.map((v) => replaceNoodlPlaceholders(options, v))
  } else if (u.isObj(value)) {
    return u.entries(value).reduce((acc, [k, v]) => {
      acc[k] = replaceNoodlPlaceholders(options, v)
      return acc
    }, {})
  }

  return value
}

exports.replaceNoodlPlaceholders = replaceNoodlPlaceholders

function ensureYmlExt(value = '') {
  if (!u.isStr(value)) return value
  if (value.endsWith('.yml')) {
    return value
  }
  if (value.endsWith('yml')) {
    return `${value.substring(0, value.length - 3)}.yml`
  }
  return `${value}.yml`
}

exports.ensureYmlExt = ensureYmlExt
