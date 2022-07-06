import type { LiteralUnion } from 'type-fest'
import type NoodlConfig from './Config'
import { stringify } from './utils/yml'

class NoodlCadlEndpoint {
  config: NoodlConfig | null = null
  fileSuffix: LiteralUnion<'.yml', string> = '.yml'
  preload: string[] = []
  pages: string[] = []
  startPage: string

  build() {
    return stringify(this.toJSON())
  }

  toJSON() {
    return {
      baseUrl: `\${cadlBaseUrl}`,
      assetsUrl: `\${cadlBaseUrl}assets/`,
      languageSuffix: {
        zh_CN: '_cn',
        es_ES: '_es',
        unknown: '_en',
      },
      fileSuffix: this.fileSuffix,
      startPage: this.startPage,
      preload: this.preload,
      pages: this.pages,
    }
  }
}

export default NoodlCadlEndpoint
