import { NOODLComponentProps, Page as NOODLUiPage } from 'noodl-ui'

export interface OnBeforePageChange {
  pageName: string
  rootNode: HTMLDivElement
}

export interface OnBeforePageRender {
  next: NOODLUiPage
  previousPage: string
}

export interface PageSnapshot extends NOODLUiPage {
  components: NOODLComponentProps[]
}
