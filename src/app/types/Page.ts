import { Page as NOODLUiPage } from 'noodl-ui'

export interface OnBeforePageChange {
  rootNode: HTMLDivElement
}

export interface OnAfterPageChangeArgs {
  next: NOODLUiPage
  previousPage: string
}
