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
