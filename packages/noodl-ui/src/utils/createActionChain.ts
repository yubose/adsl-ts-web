import {
  ActionChain,
  ActionChainInstancesLoader,
  createActionChain as __createActionChain,
} from 'noodl-action-chain'
import {
  NOODLUIAction,
  NOODLUIActionChain,
  NOODLUIActionObject,
  NOODLUITrigger,
} from '../types'

function createActionChain(args: {
  actions: NOODLUIActionObject[]
  trigger: NOODLUITrigger
  loader?: ActionChainInstancesLoader<NOODLUIActionObject, NOODLUIAction>
}): NOODLUIActionChain

function createActionChain(
  trigger: NOODLUITrigger,
  actions: NOODLUIActionObject[],
  loader?: ActionChainInstancesLoader<NOODLUIActionObject, NOODLUIAction>,
): NOODLUIActionChain

function createActionChain(
  args:
    | NOODLUITrigger
    | {
        actions: NOODLUIActionObject[]
        trigger: NOODLUITrigger
        loader?: ActionChainInstancesLoader<NOODLUIActionObject, NOODLUIAction>
      },
  actions?:
    | NOODLUIActionObject[]
    | ActionChainInstancesLoader<NOODLUIActionObject, NOODLUIAction>,
  loader?: ActionChainInstancesLoader<NOODLUIActionObject, NOODLUIAction>,
) {
  let ac: ActionChain

  if (typeof args === 'string') {
    ac = __createActionChain(args, actions as NOODLUIActionObject[], loader)
  } else {
    ac = __createActionChain(args)
  }

  return ac as NOODLUIActionChain
}

export default createActionChain
