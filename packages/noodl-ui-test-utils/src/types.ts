/**
 * Types for unit testing. Mostly used for typing mock functions
 */
import { ActionChainInstancesLoader } from 'noodl-action-chain'
import { NOODLUIActionObject, NOODLUITrigger } from 'noodl-ui'

export interface MockGetActionChainOptions {
  actions: (NOODLUIActionObject | MockGetActionChainExtendedActionsArg)[]
  load?: boolean
  loader?: ActionChainInstancesLoader
  trigger: NOODLUITrigger
}

export interface MockGetActionChainExtendedActionsArg {
  action: NOODLUIActionObject
  fn: (...args: any[]) => any
}
