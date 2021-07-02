import NOODL from '@aitmed/cadl'
import { Viewport as VP } from 'noodl-ui'
import { isStable } from 'noodl-utils'

const BASE = 'https://public.aitmed.com/config'
export const CONFIG_KEY = 'testpage'
const LOCAL_SERVER = `http://127.0.0.1:3001/${CONFIG_KEY}.yml`
const SAFE_DEPLOY_URL = getConfigEndpoint('meet2d')

function getConfigEndpoint(name: string) {
  let path = ''
  const isLocal = process.env.NODE_ENV === 'development'
  const isLocalExplicit = process.env.USE_DEV_PATHS
  if (isLocal || isLocalExplicit) {
    path = `/${name}.yml`
  }
  return BASE + path
}

// SAFE_DEPLOY_URL is a guard to force the app to use one of the above links
// that use public.aitmed.com as the host name when deploying to s3.
// So this should never be edited. Instead, change the 2nd condition
// instead of changing the SAFE_DEPLOY_URL
//    ex ---> process.env.DEPLOYING ? SAFE_DEPLOY_URL : TESTPAGE
//    ex ---> process.env.DEPLOYING ? SAFE_DEPLOY_URL : MEET2D
//    ex ---> process.env.DEPLOYING ? SAFE_DEPLOY_URL : LOCAL_SERVER

// China Sever
// const configUrl = `${BASE}/${document.domain.split('.')[0]}.yml?`

const CONFIG_URL = process.env.DEPLOYING ? SAFE_DEPLOY_URL : LOCAL_SERVER
// China Sever
// const CONFIG_URL = `https://public.ahmucel.com/config/${document.domain.split('.')[0]}.yml?`
let noodl: NOODL | undefined

const dbConfig = {
  locateFile: (filename) => {
    return `./${filename}`
  },
}

resetInstance()

export function resetInstance() {
  noodl = new NOODL({
    aspectRatio:
      typeof window !== 'undefined'
        ? VP.getAspectRatio(window.innerWidth, window.innerHeight)
        : 1,
    cadlVersion: isStable() ? 'stable' : 'test',
    configUrl: CONFIG_URL,
    // configUrl: `${BASE}/${CONFIG_KEY}.yml`,
    dbConfig,
  })
  return noodl
}

export default noodl as NOODL
