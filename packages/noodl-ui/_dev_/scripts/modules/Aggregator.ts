import _ from 'lodash'
import Bases from './Bases'
import Pages from './Pages'

export interface AggregatorOptions {
  modules?: { bases?: Bases; pages?: Pages }
  endpoint?: string
  exts?: { json?: boolean; yml?: boolean }
}

class Aggregator {
  #mod: AggregatorOptions['modules'] = {}
  endpoint: AggregatorOptions['endpoint']
  exts: AggregatorOptions['exts']

  constructor({ modules, endpoint = '', exts }: AggregatorOptions = {}) {
    let bases: Bases
    let pages: Pages
    if (_.isPlainObject(modules)) {
      bases = modules.bases
      pages = modules.pages
    }
    if (!bases) bases = new Bases()
    if (!pages) pages = new Pages()
    this.#mod.bases = bases
    this.#mod.pages = pages
    this.endpoint = endpoint
    this.exts = exts || { json: true, yml: false }
    bases.endpoint = this.endpoint
    bases.exts = this.exts
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
