import jsPDF from 'jspdf'

export interface Bounds {
  height: number
  start: number
  end: number
  native: DOMRect | null
}

export interface Item {
  start: number
  end: number
  id: string
  height: number
  text?: string
  node: HTMLElement
  hide: {
    self: boolean
    /** Element ids */
    children: string[]
  }
}

export type ElementArg<N extends HTMLElement = HTMLElement> =
  | null
  | undefined
  | HTMLElement
  | HTMLElement[]
  | HTMLCollection
  | NodeListOf<N>

export interface Options {
  format?: number[]
  orientation?: 'landscape' | 'portrait'
  pageWidth?: number
  pageHeight?: number
  overallWidth?: number
  overallHeight?: number
}

export type Orientation = 'portrait' | 'landscape'

export interface Settings {
  pdf: jsPDF | null
  pageWidth: number
  pageHeight: number
  orientation: Orientation
  overallWidth: number
  overallHeight: number
}

export interface SnapObject<N extends HTMLElement = HTMLElement> {
  start: {
    position: number
    node: N
  }
  end: {
    position: number
    node: N | null
  }
  height: number
  native: DOMRect | null
  hide?: {
    /** Element ids */
    children?: string[]
  }
}
