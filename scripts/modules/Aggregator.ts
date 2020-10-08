import _ from 'lodash'
import BaseSetup from './BaseSetup'
import AppSetup from './AppSetup'

export interface AggregatorOptions {
  endpoint?: string
  json?: boolean
  yml?: boolean
}

class Aggregator {
  #baseSetup: BaseSetup
  #appSetup: AppSetup
  items: { [name: string]: any } = {}
  endpoint: AggregatorOptions['endpoint']

  constructor({ endpoint, ...options }: AggregatorOptions) {
    this.#baseSetup = new BaseSetup({ endpoint, ...options })
    this.#appSetup = new AppSetup(options)
    this.endpoint = endpoint
  }

  async load({ includeBasePages, includePages }) {
    console.log(includeBasePages)
    const {
      rootConfig: { json: rootConfig },
      noodlConfig: { json: noodlConfig },
    } = await this.#baseSetup.load({ includeBasePages })
    if (includePages) {
      this.#appSetup.baseUrl = rootConfig.cadlBaseUrl
      this.#appSetup.endpoint = rootConfig.cadlBaseUrl + rootConfig.cadlMain
      await this.#appSetup.load(noodlConfig.page)
    }
    _.assign(this.items, this.#baseSetup.items, this.#appSetup.items)
    return this.items
  }

  get base() {
    return this.#baseSetup
  }

  get app() {
    return this.#appSetup
  }

  get length() {
    return _.keys(this.items).length
  }
}

export default Aggregator
