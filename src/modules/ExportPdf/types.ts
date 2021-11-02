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

export interface Options {
  format?: number[]
  orientation?: 'landscape' | 'portrait'
  pageWidth?: number
  pageHeight?: number
  overallWidth?: number
  overallHeight?: number
}

export type Orientation = 'portrait' | 'landscape'

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
