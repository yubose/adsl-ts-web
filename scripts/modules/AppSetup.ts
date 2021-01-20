// @ts-nocheck
import chunk from 'lodash/chunk'
import SetupHelper from './SetupHelper'
export interface PagesOptions {
  baseUrl?: string
  endpoint?: string
  json?: boolean
  yml?: boolean
}

class AppSetup {
  #baseUrl: string
  #endpoint: string
  #helper: SetupHelper
  baseUrl: PagesOptions['baseUrl']
  endpoint: PagesOptions['endpoint']

  constructor(options: PagesOptions = {}) {
    const { baseUrl, endpoint } = options
    this.#helper = new SetupHelper(options)
    this.baseUrl = baseUrl
    this.endpoint = endpoint
  }

  async load(pageNames: string[]) {
    const loadPage = async (pageName: string) => {
      const url = this.baseUrl + pageName + '_en.yml'
      await this.#helper.loadNoodlObject({
        url,
        name: pageName,
      })
    }

    const chunks = chunk(pageNames, Math.ceil(pageNames.length / 4))
    // Parallel reqs for instant response
    let chunk1: any = Promise.all(chunks[0].map(loadPage))
    let chunk2: any = Promise.all(chunks[1].map(loadPage))
    let chunk3: any = Promise.all(chunks[2].map(loadPage))
    let chunk4: any = Promise.all(chunks[3].map(loadPage).filter(Boolean))
    await chunk1
    await chunk2
    await chunk3
    await chunk4
    return this.#helper.items
  }

  get items() {
    return this.#helper.items
  }

  get baseUrl() {
    return this.#baseUrl
  }

  set baseUrl(baseUrl: string) {
    this.#baseUrl = baseUrl
  }

  get endpoint() {
    return this.#endpoint
  }

  set endpoint(endpoint: string) {
    this.#endpoint = endpoint
  }
}

export default AppSetup
