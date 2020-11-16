import _ from 'lodash'
import Logger from 'logsnap'
import {
  ActionChainActionCallbackOptions,
  IAction,
  IActionChain,
  IActionChainBuildOptions,
} from '../types'

const log = Logger.create('execute [ActionChain]')

export const createActionChainGenerator = function (queue: IAction[]) {
  return async function* getExecutor() {
    let action: IAction | undefined
    let results: { action: IAction | undefined; result: any }[] = []

    while (queue.length) {
      action = queue.shift()
      results.push({
        action: action,
        result: await (yield { action, results }),
      })
    }

    return results
  }
}

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

    async function executeActions(args: any[]) {
      try {
        onStart?.()

        if (queue.length) {
          executor = executor?.()

          let action: IAction | undefined
          let result: any
          let iterator:
            | IteratorYieldResult<{
                action: IAction
                results: any[]
              }>
            | IteratorReturnResult<{
                action: IAction
                results: any[]
              }>
            | undefined = await executor?.next?.()

          while (!iterator?.done) {
            action = iterator?.value?.action
            // Skip to the next loop
            if (!action) {
              iterator = await next(executor)
            }
            // Goto action (will replace the soon-to-be-deprecated actionType: pageJump action)
            else {
              result = await execute(action, {
                args,
                component,
                context,
                queue,
                trigger,
              })
              // log.grey('Current results from action chain', result)
              if (_.isPlainObject(result)) {
                iterator = await next(executor, result)
              } else if (_.isString(result)) {
                // TODO
              } else if (_.isFunction(result)) {
                // TODO
              } else {
                iterator = await next(executor, result)
              }

              // if (result?.value?.result) {
              //   if (action.type) log.func(action.type)
              //   log.green(
              //     `Received a returned value from a(n) "${action.type}" executor`,
              //     result,
              //   )
              // }
            }
          }
          // this.onChainEnd?.(
          //   this.actions as IAction[],
          //   this.getCallbackOptions({ event, ...buildOptions }),
          // )
          onEnd?.()
          return iterator
        } else {
          // log
        }
      } catch (error) {
        // this.onChainError?.(
        //   err,
        //   this.#current,
        //   this.getCallbackOptions({ event, error: err, ...buildOptions }),
        // )
        onError?.({ args, error })
        // TODO more handling
        abort(
          `The value of "actions" given to this action chain was null or undefined`,
        )
      }
    }

    return executeActions
  }
}

export default createExecute
