import NOODL from '@aitmed/cadl'

const PORTAL_CONFIG = getConfigEndpoint('portal')
const PORTAL_CONFIG_NATIVE_JS = getConfigEndpoint('cadltest')
const PORTAL_CONFIG_PHASE_2 = getConfigEndpoint('portal.phase.2')
const LANDING_PAGE_CONFIG = getConfigEndpoint('landing.page')
const AITCOM11_CONFIG = getConfigEndpoint('cadltest')
const PATIENT_CONFIG = getConfigEndpoint('patient')
const PATIENT_D_CONFIG = getConfigEndpoint('patientd')
const MEET2_CONFIG = getConfigEndpoint('meet2')
const MEET2D_CONFIG = getConfigEndpoint('meet2d')
const MEET11_CONFIG = getConfigEndpoint('meet11')

const noodl = new NOODL({
  aspectRatio: 3,
  cadlVersion: process.env.ECOS_ENV === 'stable' ? 'stable' : 'test',
  configUrl: MEET2D_CONFIG,
})

function getConfigEndpoint(
  type:
    | 'cadltest'
    | 'meet2' // native js (upload document, etc)
    | 'meet2d' // native js (upload document, etc)
    | 'meet11' // testing for jiahao + new features/syntax testing
    | 'landing.page'
    | 'patient'
    | 'patientd'
    | 'portal'
    | 'portal.phase.2',
) {
  let path = ''
  const base = 'https://public.aitmed.com/config'
  const isLocal = process.env.NODE_ENV === 'development'
  if (isLocal) {
    const getFilename = (t: typeof type) => {
      switch (type) {
        case 'cadltest':
          return '/cadltest'
        case 'landing.page':
          return '/www2'
        case 'meet11':
          return '/meet11'
        case 'meet2':
          return '/meet2'
        case 'meet2d':
          return '/meet2d'
        case 'portal.phase.2':
          return '/meet2'
        case 'portal':
        default:
          return '/meetdev'
      }
    }
    path = getFilename(type) + '.yml'
  }
  return base + path
}

export default noodl
