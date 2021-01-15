import SetupHelper from './SetupHelper'

export interface BasesOptions {
  endpoint?: string
  json?: boolean
  yml?: boolean
  meta?: {
    rootConfig?: { label?: string }
    appConfig?: { label?: string }
  }
}

class BaseSetup {
  #helper: SetupHelper
  #onRootConfig: () => any
  #onNoodlConfig: () => any
  #onBaseItems: () => any
  endpoint: BasesOptions['endpoint']
  baseUrl: string = ''
  meta = {
    rootConfig: { label: 'root' },
    appConfig: { label: 'noodl' },
  }
  noodlEndpoint: string = ''
  noodlBaseUrl: string = ''
  version: string = ''

  constructor(options: BasesOptions = {}) {
    this.#helper = new SetupHelper(options)
    this.endpoint = options.endpoint
    if (options?.meta) {
      this.meta.rootConfig.label = options.meta.rootConfig?.label || 'root'
      this.meta.appConfig.label = options.meta.appConfig?.label || 'noodl'
    }
  }

  async load({ includeBasePages = true }: { includeBasePages?: boolean }) {
    // Load/save root config in memory
    await this.#helper.loadNoodlObject({
      name: this.meta.rootConfig.label,
      url: this.endpoint,
    })
    const items = this.#helper.items
    // Set version, root baseUrl
    this['version'] = this.getLatestVersion()
    this['baseUrl'] = (
      items[this.meta.rootConfig.label]?.json.cadlBaseUrl ||
      items[this.meta.rootConfig.label]?.json.noodlBaseUrl
    )?.replace?.('${cadlVersion}', this.version)
    this.onRootConfig?.()
    // Set noodl config, endpoint, baseUrl
    this['noodlEndpoint'] = `${this.baseUrl}${
      items[this.meta.rootConfig.label]?.json?.cadlMain
    }`
    await this.#helper.loadNoodlObject({
      url: this.noodlEndpoint,
      name: this.meta.appConfig.label,
    })
    const noodlConfig = this.#helper.get(this.meta.appConfig.label)
    this['noodlBaseUrl'] = items[
      this.meta.appConfig.label
    ]?.json.baseUrl.replace('${cadlBaseUrl}', this.baseUrl)
    this.onNoodlConfig?.()
    if (includeBasePages) {
      const numPreloadingPages = this.noodlConfig?.json.preload?.length || 0
      for (let index = 0; index < numPreloadingPages; index++) {
        const name = this.noodlConfig?.json.preload?.[index]
        const url = `${this.noodlBaseUrl}${name}_en.yml`
        await this.#helper.loadNoodlObject({ url, name })
      }
      this.onBaseItems?.()
    }
    return {
      rootConfig: this.rootConfig?.json,
      noodlConfig: noodlConfig?.json,
      ...this.#helper.items,
    }
  }

  get rootConfig() {
    return this.#helper.items[this.meta.rootConfig.label]
  }

  get noodlConfig() {
    return this.#helper.items[this.meta.appConfig.label]
  }

  get items() {
    return this.#helper.items
  }

  getLatestVersion() {
    const rootConfig = this.rootConfig.json
    return rootConfig?.web?.cadlVersion?.test || rootConfig?.versionNumber
  }

  getRootConfig() {
    return this.rootConfig?.json
  }

  getNoodlConfig() {
    return this.noodlConfig?.json
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
