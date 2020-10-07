// @ts-nocheck
import _ from 'lodash'
import axios from 'axios'
import yaml from 'yaml'

const getExtsObj = () => ({ yml: '', json: {} })

export interface BasesOptions {
  endpoint?: string
  exts?: { json?: boolean; yml?: boolean }
}

class BaseSetup {
  #onRootConfig: () => any
  #onNoodlConfig: () => any
  #onBaseItems: () => any
  endpoint: BasesOptions['endpoint']
  exts: BasesOptions['exts']
  rootConfig: { yml: string; json: { [key: string]: any } } = getExtsObj()
  noodlConfig: { yml: string; json: { [key: string]: any } } = getExtsObj()
  baseUrl: string = ''
  noodlEndpoint: string = ''
  noodlBaseUrl: string = ''
  version: string = ''
  baseItems: {
    [key: string]: {
      yml?: string
      json?: { [key: string]: any }
    }
  } = {}

  constructor(options: BasesOptions = {}) {
    const { endpoint, exts } = options
    this.endpoint = endpoint
    this.exts = exts
  }

  async load({ includeBasePages = true }: { includeBasePages?: boolean }) {
    // Load/save root config in memory
    await this.#loadRootConfig()
    this.onRootConfig?.()
    // Set noodl config, endpoint, baseUrl
    await this.#loadNoodlConfig()
    this.onNoodlConfig?.()
    if (includeBasePages) {
      await this.#loadBasePages()
      this.onBaseItems?.()
    }
  }

  #loadRootConfig = async () => {
    let { data: yml } = await axios.get(this.endpoint)
    // Save root config in memory
    if (this.exts.yml) this.rootConfig['yml'] = yml
    this.rootConfig['json'] = yaml.parse(yml)
    // Set version, root baseUrl
    this['version'] = this.getLatestVersion()
    this['baseUrl'] = (
      this.rootConfig.json.cadlBaseUrl || this.rootConfig.json.noodlBaseUrl
    )?.replace?.('${cadlVersion}', this.version)
  }

  /** Load/save noodl config, endpoint, baseUrl in memory */
  #loadNoodlConfig = async () => {
    let yml: string = ''
    this['noodlEndpoint'] = `${this.baseUrl}${this.rootConfig.json.cadlMain}`
    yml = (await axios.get(this.noodlEndpoint)).data
    if (this.exts.yml) this.noodlConfig['yml'] = yml
    this.noodlConfig['json'] = yaml.parse(yml)
    this['noodlBaseUrl'] = this.noodlConfig.json.baseUrl.replace(
      '${cadlBaseUrl}',
      this.baseUrl,
    )
  }

  #loadBasePages = async () => {
    let yml: string = 'yml'
    const numPreloadingPages = this.noodlConfig.json.preload?.length || 0
    for (let index = 0; index < numPreloadingPages; index++) {
      const name = this.noodlConfig.json.preload?.[index]
      const url = `${this.noodlBaseUrl}${name}_en.yml`
      yml = (await axios.get(url)).data
      this.baseItems[name] = {}
      if (this.exts.yml) this.baseItems[name]['yml'] = yml
      if (this.exts.json) this.baseItems[name]['json'] = yaml.parse(yml)
    }
  }

  getLatestVersion() {
    return (
      (
        this.rootConfig.json?.web?.cadlVersion ||
        this.rootConfig.json?.web?.noodlVersion
      )?.test ||
      this.rootConfig.json?.versionNumber ||
      this.rootConfig.json?.versionNumber
    )
  }

  getRootConfig() {
    return this.rootConfig.json
  }

  getNoodlConfig() {
    return this.noodlConfig.json
  }

  get onRootConfig() {
    return this.#onRootConfig
  }

  get onNoodlConfig() {
    return this.#onNoodlConfig
  }

  get onBaseItems() {
    return this.#onBaseItems
  }

  set onRootConfig(fn: () => any) {
    this.#onRootConfig = fn
  }

  set onNoodlConfig(fn: () => any) {
    this.#onNoodlConfig = fn
  }

  set onBaseItems(fn: () => any) {
    this.#onBaseItems = fn
  }
}

export default BaseSetup
