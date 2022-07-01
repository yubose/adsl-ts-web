import * as u from '@jsmanifest/utils'
import type { RootConfig, AppConfig } from 'noodl-types'
import fs from 'fs-extra'
import path from 'path'
import fetch from 'node-fetch'
import NoodlConfig from './Config'
import NoodlCadlEndpoint from './CadlEndpoint'
import { fetchYml, parse as parseYml } from './utils/yml'
import { assertNonEmpty } from './utils/assert'
import * as is from './utils/is'

function mapToJS<Key extends string = string>(
  map: Map<Key, any>,
): Record<Key, any> {
  const result = {} as Record<Key, any>
  if (!map.size) return result
  return [...map.entries()].reduce((acc, [key, value]) => {
    acc[key] = value
    return acc
  }, result)
}

class NoodlLoaderv2 {
  #preload = new Map()
  #pages = new Map()
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
  }

  get root() {
    return {
      Config: this.config.toJSON(),
      Global: {},
      ...mapToJS(this.#preload),
      ...mapToJS(this.#pages),
    }
  }

  async load(
    value: string,
    options: {
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
          let yml = await fetchYml(url.href)

          if (yml) {
            if (typeof yml === 'string') {
              let json: Record<string, any> | undefined

              try {
                json = parseYml('object', yml)
              } catch (error) {
                const err =
                  error instanceof Error ? error : new Error(String(error))
                console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
              }

              if (json) {
                if (configKey && regex.test(configKey)) {
                  this.loadRootConfig(json as RootConfig)
                  if (options?.appConfig === false) return
                  // Continue with app config
                } else if (appKey && regex.test(appKey)) {
                  this.loadAppConfig(json as AppConfig)
                } else {
                  if (is.stringInArray(this.cadlEndpoint.preload, name)) {
                    //
                  } else if (is.stringInArray(this.cadlEndpoint.pages, name)) {
                    //
                  }
                }
              }
            }
          }
        }
      } else if (is.file(value)) {
        const parsed = path.parse(value)
        console.log(parsed)
      } else if (typeof value === 'string') {
        //
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    }
  }

  loadRootConfig(rootConfig: RootConfig) {
    assertNonEmpty(rootConfig, 'rootConfig')

    for (const [key, value] of u.entries(rootConfig)) {
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
          ].includes(key)
        ) {
          this.config[key] = value
        } else if (/viewWidthHeightRatio/i.test(key)) {
          //
        } else if (['web', 'ios', 'android'].includes(key)) {
          //
        } else if (key === 'timestamp') {
          //
        }
      }
    }

    return this
  }

  loadAppConfig(appConfig: AppConfig) {
    assertNonEmpty(appConfig, 'appConfig')
    return this
  }

  loadPreload(name: string, preload: Record<string, any>) {
    this.#preload.set(name, preload)
    return this
  }

  loadPage(name: string, page: Record<string, any>) {
    this.#pages.set(name, page)
    return this
  }
}

export default NoodlLoaderv2
