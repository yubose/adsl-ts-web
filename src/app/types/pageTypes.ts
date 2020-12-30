import { AnyFn } from '.'
import * as constants from '../../constants'

export type PageCbs<K extends PageEvent | PageStatus> = Record<K, AnyFn[]>
export type PageEvent = typeof constants.pageEvent[keyof typeof constants.pageEvent]
export type PageStatus = typeof constants.pageStatus[keyof typeof constants.pageStatus]
export type PageModalId = keyof typeof constants['modalIds']

export interface PageCallbackObjectConfig {
  fn: AnyFn
  cond?(snapshot?: PageSnapshot): boolean
  once?: boolean
}

export interface PageModalState {
  id: string
  opened: boolean
  context: null | { [key: string]: any }
  props: { [key: string]: any }
}

export interface PageSnapshot {
  status: PageStatus
  previous: string
  current: string
  requestingPage: string
  rootNode: HTMLDivElement
}
