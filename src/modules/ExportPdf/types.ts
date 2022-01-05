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

export interface PdfBlueprint {
  el: HTMLElement
  format: [width: number, height: number]
  pages: PageBlueprint[]
  pageWidth: number
  pageHeight: number
  path: PathObject[]
  remainingHeight: number
  totalWidth: number
  totalHeight: number
  totalPages: number
}

export interface PageBlueprint {
  children?: any[]
  el: HTMLElement
  currPageHeight: number
  endY: number
  id: string
  format: [number, number]
  orientation: Orientation
  parent: string | null
  path: any[]
  page: number
  remaining: number
  startY: number
  viewTag?: string
}

export interface PathObject {
  id: string
  tagName: string
  top: number
  bottom: number
  height: number
  scrollHeight: number
  y: number
}
