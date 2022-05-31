/**
 * SOON TO BE DEPRECATED: resetInstance
 * Environment/config key will be passed in using CLI
 *
 * @example
 *
 * ```shell
 * npm run build:deploy:test -- --env CONFIG=admind3 ENV=stable
 * ```
 */

import { CADL as NOODL } from '@aitmed/cadl'
import { Viewport as VP } from 'noodl-ui'
import { isStable } from 'noodl-utils'
import type { Env } from 'noodl-types'
import { Client as SearchClient } from 'elasticsearch-browser'

export const lvl3Options = {
  baseConfigUrl: 'https://public.aitmed.com/config',
  app: 'prod2',
  get url() {
    // ONLY used if passed in as cli args via --env APP=<config name>
    // See webpack.config.js for details in the "_getLocalAppHelpers" function
    // (ex: npm run start:test -- --env APP=admind3)
    // if (process.env.LOCAL_CONFIG_URL) return process.env.LOCAL_CONFIG_URL
    // This will be returned (normal use) if NOT using -- env APP=<config name>
    return isDeploying
      ? safeDeployUrl
      : `http://127.0.0.1:3001/${lvl3Options.app}.yml`
    // return `./admin/config/localhost.yml`
  },
}

// safeDeployUrl is a guard to force the app to use one of the above links
// that use public.aitmed.com as the host name when deploying to s3.
// So this should never be edited. Instead, change the 2nd condition
// instead of changing the safeDeployUrl
//    ex ---> isDeploying ? safeDeployUrl : TESTPAGE
//    ex ---> isDeploying ? safeDeployUrl : MEET2D
//    ex ---> isDeploying ? safeDeployUrl : LOCAL_SERVER
const isDevelopment = process.env.NODE_ENV === 'development'
const isDeploying = !!process.env.DEPLOYING
const safeDeployUrl = getConfigEndpoint(lvl3Options.app)

export function getConfigEndpoint(name: string) {
  let path = ''
  // NOTE - Forgot what process.env.USE_DEV_PATHS does but do not remove
  const isLocalExplicit = process.env.USE_DEV_PATHS
  if (isDevelopment) path = `/${name}.yml`
  return lvl3Options.baseConfigUrl + path
}

export let noodl: NOODL | undefined

// const dbConfig = {
//   locateFile: (filename) => {
//     return `https://cdn.jsdelivr.net/npm/sql.js@1.6.2/dist/sql-wasm.wasm`
//   },
// }

resetInstance()

/**
 * @deprecated
 * This will be removed in the future to use createInstance instead
 */
export function resetInstance() {
  noodl = new NOODL({
    aspectRatio:
      typeof window !== 'undefined'
        ? VP.getAspectRatio(window.innerWidth, window.innerHeight)
        : 1,
    cadlVersion: isStable() ? 'stable' : 'test',
    configUrl: lvl3Options.url,
    // configUrl: `${BASE}/${CONFIG_KEY}.yml`,
    dbConfig: undefined,
    SearchClient,
  })
  return noodl
}

/**
 * Returns the instance of level 3 sdk. If overwrite is true it will not reuse the previous but and instead create a new one.
 * @param { ConstructorParameters<typeof NOODL>[0] } [options]
 * @param { boolean } [overwrite]
 */
export function createInstance(
  options?: Partial<ConstructorParameters<typeof NOODL>[0]> & {
    env?: Env
    overwrite?: boolean
  },
) {
  if (!noodl || options?.overwrite) {
    noodl = new NOODL({
      aspectRatio:
        typeof window !== 'undefined'
          ? VP.getAspectRatio(window.innerWidth, window.innerHeight)
          : 1,
      cadlVersion: options?.env || isStable() ? 'stable' : 'test',
      configUrl: lvl3Options.url,
      // configUrl: `${BASE}/${CONFIG_KEY}.yml`,
      dbConfig: undefined,
      SearchClient,
      ...options,
    })
  }
  return noodl
}

export default noodl as NOODL
