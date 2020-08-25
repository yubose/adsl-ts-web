import { Status } from '@aitmed/ecos-lvl2-sdk'

export type AccountStatus = Omit<Status, 'code' | 'config'> & {
  code: null | number
  config: Partial<Status['config']> | null
  phone_number: string
  userId: string
}

export interface CreateLoggerOptions {
  prefixes?: string[]
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

export type Styles = Record<keyof CSSStyleDeclaration, any>

export * from './storeTypes'
export * from './Page'
