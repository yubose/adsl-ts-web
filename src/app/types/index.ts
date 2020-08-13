import { Status } from '@aitmed/ecos-lvl2-sdk'
import { ConfigData } from '@aitmed/ecos-lvl2-sdk/dist/types/common/store'

export type AccountStatus = Omit<Status, 'code' | 'config'> & {
  code: null | number
  config: Partial<ConfigData> | null
  phone_number: string
  userId: string
}

export interface RootConfig {
  apiHost?: string
  apiPort?: string
  webApiHost?: string
  appApiHost?: string
  connectiontimeout?: string
  loadingLevel: number
  versionNumber: number
  web: {
    cadlVersion: NOODLVersion
  }
  ios: {
    cadlVersion?: NOODLVersion
  }
  android: {
    cadlVersion: NOODLVersion
  }
  cadlEndpoint: string
  timestamp?: string
}

export interface NOODLVersion {
  stable: number
  test: number
}
