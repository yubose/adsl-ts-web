import * as u from '@jsmanifest/utils'
import fs from 'fs-extra'
import path from 'path'
import y from 'yaml'
import NoodlConfig from '../Config'
import NoodlCadlEndpoint from '../CadlEndpoint'
import loadFile from '../utils/loadFile'
import { fetchYml, isNode, merge, toDocument, unwrap } from '../utils/yml'
import { assertNonEmpty } from '../utils/assert'
import { isPageInArray } from './loaderUtils'
import * as is from '../utils/is'
import * as t from '../types'

class NoodlLoader {
  #preload = new Map<string, Record<string, t.YAMLNode>>()
  #pages = new Map<string, Record<string, t.YAMLNode>>()
  #root = {
    Config: null,
    Global: {} as Record<string, t.YAMLNode>,
  } as {
    Config: NoodlConfig | null
    Global: Record<string, t.YAMLNode>
  } & { [key: string]: any }

  config: NoodlConfig
  cadlEndpoint: NoodlCadlEndpoint;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      config: this.config.toJSON(),
      cadlEndpoint: this.cadlEndpoint.toJSON(),
    }
  }

  constructor() {
    this.config = new NoodlConfig()
    this.cadlEndpoint = new NoodlCadlEndpoint()
    this.#root.Config = this.config
  }

  get root() {
    return this.#root
  }

  async load(
    value: string,
    options?: {
      appConfig?: boolean
      preload?: boolean
      pages?: boolean
    },
  ) {
    try {
      if (is.url(value)) {
        let url = new URL(value)
        let { origin, protocol, host, pathname } = url
        let { base: filename, ext, name } = path.parse(url.href)

        if (name.endsWith('_en')) name = name.substring(0, name.length - 3)

        let regex = new RegExp(name, 'i')

        console.log({
          ext,
          filename,
          name,
          protocol,
          host,
          pathname,
          origin,
        })

        if (url.pathname.endsWith('.yml')) {
          let { configKey, appKey } = this.config
          let doc = await fetchYml(url.href, 'doc')
          if (doc) {
            if (configKey && regex.test(configKey)) {
              this.loadRootConfig(doc)
              if (options?.appConfig === false) return
              // Continue with app config
            } else if (appKey && regex.test(appKey)) {
              this.loadAppConfig(doc)
            } else {
              if (is.stringInArray(this.cadlEndpoint.preload, name)) {
                //
              } else if (is.stringInArray(this.cadlEndpoint.pages, name)) {
                //
              }
            }
          }
        }
      } else if (is.file(value)) {
        const { name } = path.parse(value)
        const yml = loadFile(value)
        const doc = toDocument(yml)

        console.log({ name })

        if (this.config.configKey === name) {
          if (y.isMap(doc.contents)) {
            doc.contents.items.forEach((pair) => {
              const key = unwrap(pair.key) as string
              const value = y.isNode(pair.value)
                ? pair.value.toJSON()
                : pair.value

              if (key === 'cadlBaseUrl') {
                this.config.baseUrl = value
              } else if (key === 'cadlMain') {
                this.config.appKey = value
              } else {
                this.config[key] = value
              }
            })
          }
        } else if (this.config.appKey.includes('cadlEndpoint')) {
          if (y.isMap(doc.contents)) {
            doc.contents.items.forEach((pair) => {
              const key = unwrap(pair.key) as string
              const value = y.isNode(pair.value)
                ? pair.value.toJSON()
                : pair.value

              if (key === 'page') {
                this.cadlEndpoint.pages = value
              } else {
                this.cadlEndpoint[key] = value
              }
            })
          }
        } else if (isPageInArray(this.cadlEndpoint.preload, name)) {
          console.log('hello?')
          this.loadPreload(doc)
        } else if (isPageInArray(this.cadlEndpoint.pages, name)) {
          this.loadPage(name, doc)
        }
      } else if (u.isStr(value)) {
        //
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    }
  }

  loadRootConfig(
    rootConfig: y.Document.Parsed<y.ParsedNode> | y.Document<y.Node>,
  ) {
    assertNonEmpty(rootConfig, 'rootConfig')

    if (y.isMap(rootConfig.contents)) {
      for (const pair of rootConfig.contents.items) {
        const key = String(pair.key)
        if (u.isStr(key)) {
          if (
            [
              'apiHost',
              'apiPort',
              'webApiHost',
              'appApiHost',
              'connectiontimeout',
              'loadingLevel',
              'debug',
              'cadlBaseUrl',
              'cadlMain',
              'timestamp',
              'viewWidthHeightRatio',
            ].includes(key)
          ) {
            this.config[key] = pair.value
          } else if (['web', 'ios', 'android'].includes(key)) {
            this.config[key] = pair.value
          }
        }
      }
    }

    return this
  }

  loadAppConfig(
    appConfig: y.Document.Parsed<y.ParsedNode> | y.Document<y.Node>,
  ) {
    assertNonEmpty(appConfig, 'appConfig')

    if (y.isMap(appConfig.contents)) {
      for (const pair of appConfig.contents.items) {
        const key = String(pair.key)
        if (/assetsUrl|baseUrl|fileSuffix/i.test(key)) {
          this.cadlEndpoint[key] = pair.value
        } else if (key === 'languageSuffix') {
          this.cadlEndpoint[key] = pair.value as any
        } else if (key === 'startPage') {
          this.cadlEndpoint[key] = pair.value as any
        } else if (key === 'preload') {
          this.cadlEndpoint[key] = pair.value as any
        } else if (key === 'page') {
          this.cadlEndpoint[key] = pair.value
        }
      }
    }

    return this
  }

  loadPreload(name: t.YAMLNode | string, preload?: t.YAMLNode) {
    if (u.isStr(name)) {
      this.#root[name] = preload
    } else if (isNode(name)) {
      merge(this.#root, name)
    }
    return this
  }

  loadPage(name: string, page: any) {
    this.#root[name] = page
    return this
  }
}

export default NoodlLoader
