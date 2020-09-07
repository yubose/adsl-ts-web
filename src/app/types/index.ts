import { Status } from '@aitmed/ecos-lvl2-sdk'
import { NOODLComponentProps } from 'noodl-ui'
import createElement from 'utils/createElement'
import * as constants from '../../constants'
export * from './storeTypes'
export * from './Page'

export type AccountStatus = Omit<Status, 'code' | 'config'> & {
  code: null | number
  config: Partial<Status['config']> | null
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

export type Styles = Omit<Partial<CSSStyleDeclaration>, 'length' | 'parentRule'>

export type ModalId = keyof typeof constants['modalIds']

export interface RequestState<E = Error> {
  pending: boolean
  success: boolean
  error: null | E
  timedOut: boolean
}

export type DOMNode = ReturnType<typeof createElement>

export type DataValueElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement

export interface Parser {
  (node: DOMNode, props: NOODLComponentProps): void
}
