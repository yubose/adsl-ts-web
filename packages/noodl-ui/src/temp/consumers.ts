import { ComponentObject } from 'noodl-types'

export interface ConsumerObject<K extends keyof ComponentObject> {
  prop: K
  cond?(...args: any[]): boolean
  type: 'replace' | 'remove' | 'rename'
}
