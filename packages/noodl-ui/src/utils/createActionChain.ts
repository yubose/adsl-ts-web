import {
  ActionChain,
  ActionChainInstancesLoader,
  createActionChain as __createActionChain,
} from 'noodl-action-chain'
import {
  NUIAction,
  NUIActionChain,
  NUIActionObject,
  NUITrigger,
} from '../types'

function createActionChain(args: {
  actions: NUIActionObject[]
  trigger: NUITrigger
  loader?: ActionChainInstancesLoader<NUIActionObject, NUIAction>
}): NUIActionChain

function createActionChain(
  trigger: NUITrigger,
  actions: NUIActionObject[],
  loader?: ActionChainInstancesLoader<NUIActionObject, NUIAction>,
): NUIActionChain

function createActionChain(
  args:
    | NUITrigger
    | {
        actions: NUIActionObject[]
        trigger: NUITrigger
        loader?: ActionChainInstancesLoader<NUIActionObject, NUIAction>
      },
  actions?:
    | NUIActionObject[]
    | ActionChainInstancesLoader<NUIActionObject, NUIAction>,
  loader?: ActionChainInstancesLoader<NUIActionObject, NUIAction>,
) {
  let ac: ActionChain

  if (typeof args === 'string') {
    ac = __createActionChain(args, actions as NUIActionObject[], loader)
  } else {
    ac = __createActionChain(args)
  }

  return ac as NUIActionChain
}

export default createActionChain
