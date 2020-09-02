import { NOODLComponentProps, Page as NOODLUiPage } from 'noodl-ui'

export type OnRootNodeInitializedArgs = HTMLDivElement

export interface OnBeforePageRenderArgs {
  pageName: string
  rootNode: HTMLDivElement
}

export interface PageSnapshot extends NOODLUiPage {
  components?: NOODLComponentProps[]
}

export interface ModalState {
  id: string
  opened: boolean
  context: null | { [key: string]: any }
  props: { [key: string]: any }
}

export interface CachedPage {
  name?: string
}
