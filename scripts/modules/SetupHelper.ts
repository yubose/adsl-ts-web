import _ from 'lodash'
import yaml from 'yaml'
import chalk from 'chalk'
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
  } = {}

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
      this.items[opts.name] = this.formatResponse(yml, opts)
      return this.items
    } catch (error) {
      if (error.response?.data) {
        console.log(chalk.redBright(error.response.data))
      } else {
        console.log(chalk.redBright(`[${error.name}]: ${error.message}`))
      }
      return this.items
    }
  }

  formatResponse(yml: string, opts: { includeYml?: boolean } = {}) {
    const result = { json: yaml.parse(yml) }
    if (opts.includeYml) result['yml'] = yml
    return result
  }
}

export default SetupHelper
