import NOODL from '@aitmed/cadl'
import { getAspectRatio } from '../utils/common'

const LOCAL_SERVER = 'http://127.0.0.1:3001/message.yml'
const WWW = getConfigEndpoint('www')
const WWW2 = getConfigEndpoint('www2')
const PATIENT = getConfigEndpoint('patient')
const PATIENT_D = getConfigEndpoint('patientd')
const PROVIDER = getConfigEndpoint('provider')
const MEET2 = getConfigEndpoint('meet2')
const MEET2D = getConfigEndpoint('meet2d') // meet2d.aitmed.io
const MEET2P = getConfigEndpoint('meet2p') // meet2p.aitmed.io
const MEET3D = getConfigEndpoint('meet3d')
const TESTPAGE = getConfigEndpoint('testpage')
const NOTIFICATION = getConfigEndpoint('message')

const noodl = new NOODL({
  aspectRatio:
    typeof window !== 'undefined'
      ? getAspectRatio(window.innerWidth, window.innerHeight)
      : 1,
  cadlVersion: process.env.ECOS_ENV === 'stable' ? 'stable' : 'test',
  configUrl: MEET2D,
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
