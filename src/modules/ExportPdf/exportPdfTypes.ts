import type { createFlattener } from './flatten'

export type Flattener = ReturnType<typeof createFlattener>

export interface FlatObject {
  id: string
  children: FlatObject[]
  parentId: string | null
  height: number
  scrollHeight: number
  tagName: string
  textContent: string
}

export interface FlattenOptions {
  /**
   * El must be the firstElementChild of the target element
   */
  baseEl: HTMLElement | null | undefined
  el?: HTMLElement | null | undefined
  flattener?: Flattener
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
