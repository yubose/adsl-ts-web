/**
 * Types for unit testing. Mostly used for typing mock functions
 */
import { ActionChainInstancesLoader } from 'noodl-action-chain'
import { NUIActionObject, NUITrigger } from 'noodl-ui'

export interface MockGetActionChainOptions {
  actions: (NUIActionObject | MockGetActionChainExtendedActionsArg)[]
  load?: boolean
  loader?: ActionChainInstancesLoader
  trigger: NUITrigger
}

export interface MockGetActionChainExtendedActionsArg {
  action: NUIActionObject
  fn: (...args: any[]) => any
}
