const u = require('@jsmanifest/utils')

const regex = {
  cadlBaseUrlPlaceholder: /\${cadlBaseUrl}/,
  cadlVersionPlaceholder: /\${cadlVersion}/,
  designSuffixPlaceholder: /\${designSuffix}/,
}

const utils = {
  ensureYmlExt(value = '') {
    if (!u.isStr(value)) return value
    if (value === '') return '.yml'
    if (value.endsWith('.yml')) return value
    if (value.endsWith('.ym')) return `${value}l`
    if (value.endsWith('.y')) return `${value}ml`
    if (value.endsWith('.')) return `${value}yml`
    return `${value}.yml`
  },
  getConfigVersion(config, env = 'stable') {
    return config?.web?.cadlVersion?.[env]
  },
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
      return value.map((v) => replaceNoodlPlaceholders(options, v))
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
