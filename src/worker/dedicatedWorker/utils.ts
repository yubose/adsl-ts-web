import type { LiteralUnion } from 'type-fest'
import * as idb from 'idb-keyval'
import { parse as parseYml } from 'yaml'
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'

const baseConfigUrl = `https://public.aitmed.com/config/`

export async function getOrFetch(
  key = '',
  {
    baseUrl = '',
    config: configNameProp,
    deviceType = 'web',
    env = 'test',
    db = idb,
    postMessage = () => {},
    version,
    type = 'text',
    ...rest
  }: RequestInit & {
    baseUrl?: string
    config?: string
    db?: typeof idb
    deviceType?: nt.DeviceType
    env?: string
    postMessage?: DedicatedWorkerGlobalScope['postMessage']
    version?: LiteralUnion<'latest', string>
    type?: 'blob' | 'json' | 'text'
  } = {},
): Promise<any> {
  try {
    if (key.startsWith('http')) {
      return (await fetch(key))[type]?.()
    } else {
      if (isWrappedUrl(key)) {
        if (key.startsWith('config:')) {
          let configName = unwrapUrl(key)
          let config: nt.RootConfig | undefined = await db.get(configName)
          let configVersion =
            version || getVersionFromConfigObject(deviceType, env, config)

          let fetchConfig = async (configName: string) => {
            try {
              // Fetch a new one
              const resp = await fetch(`${baseConfigUrl}${configName}.yml`)
              const configYml = await resp.text()
              config = parseYml(configYml)
              await db.set('config', config)
              return config
            } catch (error) {
              if (error instanceof Error) throw error
              throw new Error(String(error))
            }
          }

          // Invalidated -- Fetch new config from remote
          if (!configVersion) return fetchConfig(configName)
          if (!config) return fetchConfig(configName)
          return config
        } else if (key.startsWith('preload:')) {
          let name = unwrapUrl(key)
          name.endsWith('.yml') && name.replace('.yml', '')
          return (await fetch(`${baseUrl}${name}.yml`, rest))?.[type]?.()
        } else if (key.startsWith('page:')) {
          let name = unwrapUrl(key)
          name.endsWith('.yml') && name.replace('.yml', '')
          return (await fetch(`${baseUrl}${name}.yml`, rest))?.[type]?.()
        }
      }

      return (await fetch(key, rest))?.[type]?.()
    }
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error(String(error))
  }
}

export function getVersionFromConfigObject(
  deviceType = 'web',
  env = 'test',
  config: nt.RootConfig | undefined,
): string {
  return u.isObj(config) ? config?.[deviceType]?.cadlVersion?.[env] || '' : null
}

/**
 * Returns true for urls that start with "config:", "preload:", or "page:"
 * @param url
 * @returns { boolean }
 */
export function isWrappedUrl(url = '') {
  return ['config:', 'preload:', 'page:'].some((s) => url.startsWith(s))
}

/**
 * Unwraps urls like "config:meetd2" to "meetd2"
 * @param url
 * @returns { string }
 */
export function unwrapUrl(url = '') {
  return isWrappedUrl(url) ? url.split(':')[1] : url
}
