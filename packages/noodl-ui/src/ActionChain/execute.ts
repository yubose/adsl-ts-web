import _ from 'lodash'
import Logger from 'logsnap'
import {
  ActionChainActionCallbackOptions,
  IAction,
  IActionChain,
  IActionChainBuildOptions,
} from '../types'

const log = Logger.create('execute [ActionChain]')

export const createExecute = function (
  opts: IActionChainBuildOptions & {
    abort: IActionChain<any, any>
    executor: ReturnType<ReturnType<typeof createActionChainGenerator>>
    next(
      args?: any,
    ): Promise<
      | IteratorYieldResult<{
          action: IAction
          results: any[]
        }>
      | undefined
    >
    queue: IAction[]
    onStart?(): void
    onEnd?(): void
    onError?(error: Error): void
  },
) {
  return function executeActions(
    execute: (
      action: IAction,
      handlerOptions: ActionChainActionCallbackOptions,
    ) => Promise<any>,
  ) {
    let {
      abort,
      component,
      context,
      executor,
      next,
      onStart,
      onEnd,
      onError,
      queue,
      trigger,
    } = opts

    async function executeActions(event: any) {}

    return executeActions
  }
}

export default createExecute
