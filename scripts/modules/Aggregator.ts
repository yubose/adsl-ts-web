import _ from 'lodash'
import SetupHelper from './SetupHelper'
import BaseSetup from './BaseSetup'
import AppSetup from './AppSetup'
import { loadPlugin } from 'immer/dist/internal'

export interface AggregatorOptions {
  endpoint?: string
  json?: boolean
  yml?: boolean
}

class Aggregator {
  this.#helper: SetupHelper
  endpoint: AggregatorOptions['endpoint']

  constructor({endpoint = '', json, yml }: AggregatorOptions) {
    this.#baseSetup = new BaseSetup({ json, yml })
    this.#appSetup = new AppSetup({ json, yml })
    this.endpoint = endpoint
  }

  async load({ includeBases, includePages }) {
    //
  }

  async initializeMods({
    includeBasePages,
  }: { includeBasePages?: boolean } = {}) {
    await this.#mod.bases.load({ includeBasePages })
    const noodlConfig = this.#mod.bases.getNoodlConfig()
    _.assign(this.#mod.pages, {
      baseUrl: this.#mod.bases.noodlBaseUrl,
      endpoint: this.endpoint,
      exts: this.exts,
      pageNames: noodlConfig.page || [],
    })
    await this.#mod.pages.load()
  }

  getAllObjects() {
    const objs = _.reduce(
      _.entries(this.#mod.bases.baseItems),
      (acc, [name, { json }]) =>
        acc.concat({
          name,
          data: json,
          url: '',
        }),
      this.#mod.pages.pages,
    )
    return objs
  }

  getBasesMod() {
    return this.#mod.bases
  }

  getPagesMod() {
    return this.#mod.pages
  }
}

export default Aggregator
