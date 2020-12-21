import BaseSetup, { BasesOptions } from './BaseSetup'
import AppSetup, { PagesOptions } from './AppSetup'

export interface AggregatorOptions {
  endpoint?: string
  json?: boolean
  yml?: boolean
  baseOptions?: Partial<BasesOptions>
  appOptions?: Partial<PagesOptions>
}

class Aggregator {
  #baseSetup: BaseSetup
  #appSetup: AppSetup
  items: { [name: string]: any } = {}
  endpoint: AggregatorOptions['endpoint']

  constructor({
    endpoint,
    baseOptions,
    appOptions,
    ...options
  }: AggregatorOptions) {
    this.#baseSetup = new BaseSetup({ endpoint, ...options, ...baseOptions })
    this.#appSetup = new AppSetup({ ...options, ...appOptions })
    this.endpoint = endpoint
  }

  async load({
    includeBasePages = true,
    includePages = true,
  }: { includeBasePages?: boolean; includePages?: boolean } = {}) {
    const {
      [this.base.meta.rootConfig.label]: { json: rootConfig },
      [this.base.meta.appConfig.label]: { json: noodlConfig },
    } = await this.#baseSetup.load({ includeBasePages })
    if (includePages) {
      this.#appSetup.baseUrl = this.#baseSetup.baseUrl
      this.#appSetup.endpoint = this.#baseSetup.baseUrl + rootConfig.cadlMain
      await this.#appSetup.load(noodlConfig.page)
    }
    Object.assign(this.items, this.#baseSetup.items, this.#appSetup.items)
    return this.items
  }

  get base() {
    return this.#baseSetup
  }

  get app() {
    return this.#appSetup
  }

  get length() {
    return Object.keys(this.items).length
  }

  objects({
    basePages = true,
    pages = true,
  }: { basePages?: boolean; pages?: boolean } = {}) {
    const destruct = (obj) =>
      Object.entries(obj).reduce((acc, [key, value]) => {
        acc[key] = value?.json
        return acc
      }, {} as any)
    return Object.assign(
      {},
      basePages ? destruct(this.#baseSetup.items) : undefined,
      pages ? destruct(this.#appSetup.items) : undefined,
    )
  }
}

export default Aggregator
