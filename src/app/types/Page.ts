import { Page as NOODLUiPage } from 'noodl-ui'

export interface OnBeforePageChange {
  rootNode: HTMLDivElement
}

export interface OnBeforePageRender {
  next: NOODLUiPage
  previousPage: string
}
