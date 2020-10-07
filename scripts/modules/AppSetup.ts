// @ts-nocheck
import _ from 'lodash'
import SetupHelper from './SetupHelper'

export interface PagesOptions {
  baseUrl?: string
  endpoint?: string
  json?: boolean
  yml?: boolean
}

class AppSetup {
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
      await this.#helper.loadNoodlObject({
        name: pageName,
        url: this.baseUrl + pageName,
      })
    }

    const chunks = _.chunk(pageNames, Math.ceil(pageNames.length / 4))
    // Parallel reqs for instant response
    let chunk1: any = Promise.all(chunks[0].map(loadPage))
    let chunk2: any = Promise.all(chunks[1].map(loadPage))
    let chunk3: any = Promise.all(chunks[2].map(loadPage))
    let chunk4: any = Promise.all(chunks[3].map(loadPage))
    await chunk1
    await chunk2
    await chunk3
    await chunk4

    return this.#helper.items
  }
}

export default AppSetup
