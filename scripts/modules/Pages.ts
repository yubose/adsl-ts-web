// @ts-nocheck
import _ from 'lodash'
import axios from 'axios'
import yaml from 'yaml'

export interface PagesOptions {
  baseUrl?: string
  endpoint?: string
  exts?: { json?: boolean; yml?: boolean }
  pages?: string[]
}

class Pages {
  baseUrl: PagesOptions['baseUrl']
  endpoint: PagesOptions['endpoint']
  exts: PagesOptions['exts']
  pageNames: PagesOptions['pages'] = []
  pages: { name: string; url: string; data: any }[] = []
  hash: { [pageName: string]: { [key: string]: any } } = {}

  constructor(options: PagesOptions = {}) {
    const { baseUrl, endpoint, exts, pages } = options
    this.baseUrl = baseUrl
    this.endpoint = endpoint
    this.exts = exts
    this.pageNames = pages
  }

  async load() {
    const createRequestObj = async (pageName: string) => {
      const url = `${this.baseUrl}${pageName}_en.yml`
      const req = axios.get(url)
      const yml = (await req).data
      // const yml = this.#provided
      //   ? (await axios.get(url)).data
      //   : yaml.stringify(this.hash[pageName], { indent: 2 })

      const obj = {
        name: pageName,
        url,
        data: this.exts.yml ? yml : yaml.parse(yml),
      }

      this.hash[pageName] = obj
      return this.hash[pageName]
    }

    const chunks = _.chunk(this.pageNames, Math.ceil(this.pageNames.length / 4))
    // Parallel reqs for instant response
    let chunk1: any = Promise.all(chunks[0].map(createRequestObj))
    let chunk2: any = Promise.all(chunks[1].map(createRequestObj))
    let chunk3: any = Promise.all(chunks[2].map(createRequestObj))
    let chunk4: any = Promise.all(chunks[3].map(createRequestObj))
    chunk1 = await chunk1
    chunk2 = await chunk2
    chunk3 = await chunk3
    chunk4 = await chunk4

    this.pages = chunk1.concat(chunk2, chunk3, chunk4)
    return this.pages
  }
}

export default Pages
