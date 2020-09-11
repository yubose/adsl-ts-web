import { Status } from '@aitmed/ecos-lvl2-sdk'
export * from './commonTypes'
export * from './domParserTypes'
export * from './meetingTypes'
export * from './pageTypes'
export * from './storeTypes'

export interface RequestState<E = Error> {
  pending: boolean
  success: boolean
  error: null | E
  timedOut: boolean
}

export type AccountStatus = Omit<Status, 'code' | 'config'> & {
  code: null | number
  config: Partial<Status['config']> | null
  phone_number: string
  userId: string
}
