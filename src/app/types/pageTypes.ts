import { NOODLComponentProps, Page as NOODLUiPage } from 'noodl-ui'
import { SerializedError } from './commonTypes'
import * as constants from '../../constants'

export type IPage = any

export interface CachedPageObject {
  name: string
  timestamp: number
}

export interface PageModalState {
  id: string
  opened: boolean
  context: null | { [key: string]: any }
  props: { [key: string]: any }
}

export type PageModalId = keyof typeof constants['modalIds']

export interface PageSnapshot extends NOODLUiPage {
  components?: NOODLComponentProps[]
}

// export type PageRenderStatus = typeof constants.pageRenderStatuses[number]
export type PageRenderStatus = typeof constants['renderStatus'][keyof typeof constants['renderStatus']]

export interface PageRootNodeState {
  id: string
  initializing: boolean
  initialized: boolean
  initializeError: null | SerializedError
}

export interface PageComponentsRenderState {
  rendering: boolean
  rendered: boolean
  renderError: null | SerializedError
}
