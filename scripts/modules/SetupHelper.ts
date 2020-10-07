import _ from 'lodash'
import yaml from 'yaml'
import axios from 'axios'

export interface JsonYmlBoolean {
  json: boolean
  yml: boolean
}

class SetupHelper {
  format: JsonYmlBoolean = { json: true, yml: false }
  items: {
    [name: string]: {
      json: { [key: string]: any }
      yml?: string
    }
  }

  constructor(opts: Partial<JsonYmlBoolean>) {
    this.format['json'] = !!opts.json
    this.format['yml'] = !!opts.yml
  }

  get(key: string) {
    return this.items[key]
  }

  async loadNoodlObject(
    opts: { url: string; name?: string } & Parameters<
      SetupHelper['formatResponse']
    >[1],
  ) {
    try {
      const { data: yml } = await axios.get(opts.url)
      return this.formatResponse(yml, opts)
    } catch (error) {
      throw error
    }
  }

  formatResponse(yml: string, opts: { includeYml?: boolean } = {}) {
    const result = { json: yaml.parse(yml) }
    if (opts.includeYml) result['yml'] = yml
    return result
  }
}

export default SetupHelper
