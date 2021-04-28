export type FileInputEvent = Event & {
  target: Event['target'] & { files: FileList }
}

export interface SelectFileBaseResult {
  event: FileInputEvent | FocusEvent
  files: FileList | null
}

export interface SelectFileSelectedResult extends SelectFileBaseResult {
  status: 'selected'
}

export interface SelectFileCanceledResult extends SelectFileBaseResult {
  event: FocusEvent
  files: null
  status: 'canceled'
}

export interface SelectFileErrorResult extends SelectFileBaseResult {
  event: FileInputEvent
  lineNumber: number | undefined
  columnNumber: number | undefined
  message: string | Error
  source: number | undefined
}
