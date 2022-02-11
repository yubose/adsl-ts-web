export interface StoredDOMState {
  origin: string
  page: string
  startPage: string
  root: string
  x: number
  y: number
}

export type ElementArg<N extends HTMLElement = HTMLElement> =
  | null
  | undefined
  | HTMLElement
  | HTMLElement[]
  | HTMLCollection
  | NodeListOf<N>

export type FileInputEvent = Event & {
  target: Event['target'] & { files: FileList }
}

export interface FileSelectorBaseResult {
  event: FileInputEvent | FocusEvent | null
  files: FileList | null
  status: string
}

export interface FileSelectorSelectedResult extends FileSelectorBaseResult {
  event: FocusEvent
  status: 'selected'
}

export interface FileSelectorCanceledResult extends FileSelectorBaseResult {
  event: FocusEvent
  files: null
  status: 'canceled'
}

export interface FileSelectorErrorResult extends FileSelectorBaseResult {
  event: null
  lineNumber: number | undefined
  columnNumber: number | undefined
  error: Error
  message: string | Event
  source: string | undefined
  status: 'error'
}

export type FileSelectorResult =
  | FileSelectorSelectedResult
  | FileSelectorCanceledResult
  | FileSelectorErrorResult
