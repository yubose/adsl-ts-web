import NOODL from '@aitmed/cadl'
import { getAspectRatio } from '../utils/common'

const WWW_CONFIG = getConfigEndpoint('www')
const WWW2_CONFIG = getConfigEndpoint('www2')
const PATIENT_CONFIG = getConfigEndpoint('patient')
const PATIENT_D_CONFIG = getConfigEndpoint('patientd')
const PROVIDER_CONFIG = getConfigEndpoint('provider')
const MEET2_CONFIG = getConfigEndpoint('meet2')
const MEET2D_CONFIG = getConfigEndpoint('meet2d') // meet2d.aitmed.io
const MEET2P_CONFIG = getConfigEndpoint('meet2p') // meet2p.aitmed.io
const MEET3D_CONFIG = getConfigEndpoint('meet3d')
const TESTPAGE = getConfigEndpoint('testpage')

const noodl = new NOODL({
  aspectRatio:
    typeof window !== 'undefined'
      ? getAspectRatio(window.innerWidth, window.innerHeight)
      : 1,
  cadlVersion: process.env.ECOS_ENV === 'stable' ? 'stable' : 'test',
  configUrl: MEET2D_CONFIG,
  // configUrl: 'http://localhost:8080/testpage.yml',
})

function getConfigEndpoint(name: string) {
  let path = ''
  const base = 'https://public.aitmed.com/config'
  const isLocal = process.env.NODE_ENV === 'development'
  const isLocalExplicit = process.env.USE_DEV_PATHS
  if (isLocal || isLocalExplicit) {
    path = '/' + name + '.yml'
  }
  return base + path
}

export default noodl
