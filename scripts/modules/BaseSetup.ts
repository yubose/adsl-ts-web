import _ from 'lodash'
import SetupHelper from './SetupHelper'

export interface BasesOptions {
  endpoint?: string
  json?: boolean
  yml?: boolean
}

class BaseSetup {
  #helper: SetupHelper
  #onRootConfig: () => any
  #onNoodlConfig: () => any
  #onBaseItems: () => any
  endpoint: BasesOptions['endpoint']
  baseUrl: string = ''
  noodlEndpoint: string = ''
  noodlBaseUrl: string = ''
  version: string = ''

  constructor(options: BasesOptions = {}) {
    this.#helper = new SetupHelper(options)
    this.endpoint = options.endpoint
  }

  async load({ includeBasePages = true }: { includeBasePages?: boolean }) {
    // Load/save root config in memory
    await this.#helper.loadNoodlObject({
      name: 'rootConfig',
      url: this.endpoint,
    })
    // Set version, root baseUrl
    this['version'] = this.getLatestVersion()
    this['baseUrl'] = (
      this.rootConfig.json.cadlBaseUrl || this.rootConfig.json.noodlBaseUrl
    )?.replace?.('${cadlVersion}', this.version)
    this.onRootConfig?.()
    // Set noodl config, endpoint, baseUrl
    this['noodlEndpoint'] = `${this.baseUrl}${this.rootConfig.json.cadlMain}`
    await this.#helper.loadNoodlObject({
      url: this.noodlEndpoint,
      name: 'noodlConfig',
    })
    const noodlConfig = this.#helper.get('noodlConfig')
    this['noodlBaseUrl'] = noodlConfig.json.baseUrl.replace(
      '${cadlBaseUrl}',
      this.baseUrl,
    )
    this.onNoodlConfig?.()
    if (includeBasePages) {
      const numPreloadingPages = this.noodlConfig.json.preload?.length || 0
      for (let index = 0; index < numPreloadingPages; index++) {
        const name = this.noodlConfig.json.preload?.[index]
        const url = `${this.noodlBaseUrl}${name}_en.yml`
        await this.#helper.loadNoodlObject({ url, name })
      }
      this.onBaseItems?.()
    }
    return {
      rootConfig: this.rootConfig.json,
      noodlConfig: noodlConfig.json,
      ...this.#helper.items,
    }
  }

  get rootConfig() {
    return this.#helper.items.rootConfig
  }

  get noodlConfig() {
    return this.#helper.items.noodlConfig
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
