import CADL from '@aitmed/cadl'
import { NOODL } from 'noodl-ui'

const PORTAL_CONFIG = getConfigEndpoint('portal')
const PORTAL_CONFIG_PHASE_2 = getConfigEndpoint('portal.phase.2')
const LANDING_PAGE_CONFIG = getConfigEndpoint('landing.page')

export const cadl = new CADL({
  aspectRatio: 3,
  cadlVersion: process.env.ECOS_ENV === 'stable' ? 'stable' : 'test',
  configUrl: PORTAL_CONFIG,
})

function getConfigEndpoint(type: 'landing.page' | 'portal' | 'portal.phase.2') {
  let path = ''
  const base = 'https://public.aitmed.com/config'
  const isLocal = process.env.NODE_ENV === 'development'
  if (isLocal) {
    path +=
      type === 'landing.page'
        ? '/www2'
        : type === 'portal.phase.2'
        ? '/meet2'
        : '/meetdev'
    path += '.yml'
  }
  return base + path
}

export const noodl = new NOODL()
