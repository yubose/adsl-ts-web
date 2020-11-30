import { Component, Page as NOODLUiPage } from 'noodl-ui'
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

// export type PageRenderStatus = typeof constants.pageRenderStatuses[number]
export type PageRenderStatus = typeof constants['renderStatus'][keyof typeof constants['renderStatus']]

export interface PageRootNodeState {
  id: string
  initializing: boolean
  initialized: boolean
  initializeError: null | any
}

export interface PageComponentsRenderState {
  rendering: boolean
  rendered: boolean
  renderError: null | any
}
