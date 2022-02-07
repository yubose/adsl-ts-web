export interface ExportPdfFlattenOptions {
  /**
   * El must be the firstElementChild of the target element
   */
  el: HTMLElement | null | undefined
  flattened?: HTMLElement[]
  accHeight?: number
  offsetStart?: number
  offsetEnd?: number
  pageHeight: number
}

export type Format =
  | [width: number, height: number]
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'A5'
  | 'A6'
  | 'A7'
  | 'A8'

export type Orientation = 'landscape' | 'portrait'
