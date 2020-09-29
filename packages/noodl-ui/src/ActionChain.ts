import _ from 'lodash'
import * as T from './types'
import Action from './Action'
import { forEachEntries } from './utils/common'
import { AbortExecuteError } from './errors'
import Logger from './Logger'

const log = Logger.create('ActionChain')

export interface ActionChainOptions {
  builtIn?: { [funcName: string]: (snapshot: T.ActionSnapshot) => any }
  evalObject?: T.OnEvalObject
  pageJump?: T.OnPageJump
  saveObject?: T.OnSaveObject
  updateObject?: T.OnUpdateObject
  onBuiltinMissing?: T.LifeCycleListeners['onBuiltinMissing']
  onChainStart?: T.LifeCycleListeners['onChainStart']
  onChainEnd?: T.LifeCycleListeners['onChainEnd']
  onChainError?: T.LifeCycleListeners['onChainError']
  onChainAborted?: T.LifeCycleListeners['onChainAborted']
  onAfterResolve?: T.LifeCycleListeners['onAfterResolve']
  needsBlob?: boolean
  parser?: T.ResolverOptions['parser']
}

class ActionChain {
  #current: Action<any> | null | undefined
  #executeAction: <OriginalAction extends T.NOODLChainActionObject>(
    action: Action<OriginalAction>,
    args: T.ActionChainCallbackOptions<Action<any>[]>,
  ) => any
  #original: T.NOODLChainActionObject[]
  #queue: Action<any>[] = []
  #gen: AsyncGenerator<any, any> | null = null
  #getConstructorOptions: () => ActionChainOptions | undefined
  #next: (args?: any) => Promise<any>
  actions: Action<any>[] | null = null
  blob: File | Blob | null = null
  current: {
    action: Action<any> | undefined
    index: number
  }
  status: null | T.ActionChainStatus = null
  builtIn?: Record<string, ActionChainOptions['builtIn']>
  evalObject?: T.OnEvalObject
  pageJump?: T.OnPageJump
  popUp?: T.OnPopup
  popUpDismiss?: T.OnPopupDismiss
  saveObject?: T.OnSaveObject
  updateObject?: T.OnUpdateObject
  onBuiltinMissing?: T.LifeCycleListeners['onBuiltinMissing']
  onChainStart?: T.LifeCycleListeners['onChainStart']
  onChainEnd?: T.LifeCycleListeners['onChainEnd']
  onChainError?: T.LifeCycleListeners['onChainError']
  onChainAborted?: T.LifeCycleListeners['onChainAborted']
  onAfterResolve?: T.LifeCycleListeners['onAfterResolve']

  constructor(
    actions?: T.NOODLChainActionObject[],
    options?: ActionChainOptions,
  ) {
    if (actions) {
      this.init(actions, options)
    }

    let timeoutRef: NodeJS.Timeout

    this.#executeAction = async <
      OriginalAction extends T.NOODLChainActionObject
    >(
      action: Action<OriginalAction>,
      handlerOptions: T.ActionChainCallbackOptions<Action<any>[]>,
    ) => {
      try {
        if (timeoutRef) clearTimeout(timeoutRef)

        timeoutRef = setTimeout(() => {
          const msg = `Action of type "${action.type}" timed out`
          action.abort(msg)
          throw new AbortExecuteError(msg)
        }, 7000)

        const result = await action.execute(handlerOptions)

        return result
      } catch (error) {
        throw error
      } finally {
        clearTimeout(timeoutRef)
      }
    }

    this.#getConstructorOptions = () => options
  }

  init(actions: T.NOODLChainActionObject[], options?: ActionChainOptions) {
    // Append the listeners to this instance
    if (options) {
      const { parser, needsBlob, ...opts } = options

      if (needsBlob) {
        // const blob =
      }

      forEachEntries(opts, (key, value) => {
        if (key === 'builtIn') {
          // TODO - customize further
          this['builtIn'] = _.reduce(
            _.entries(value),
            (acc, [funcName, fn]) => {
              acc[funcName] = fn
              return acc
            },
            {},
          )
        } else {
          this[key] = value
        }
      })
    }

    if (actions && this.#original === undefined) {
      this.#original = actions
    }

    _.forEach(actions, (actionObject) => {
      // Temporarily hardcode the actionType to blend in with the other actions
      // for now until we find a better solution
      // @ts-expect-error
      if (actionObject.goto) {
        // @ts-expect-error
        actionObject = { ...actionObject, actionType: 'goto' }
      }
      const action = new Action(actionObject, {
        timeoutDelay: 8000,
      })
      if (actionObject.actionType === 'builtIn') {
        const builtInFn = this.builtIn?.[actionObject.funcName]
        if (_.isFunction(builtInFn)) {
          action.callback = builtInFn
        }
      } else {
        action.callback = this[actionObject.actionType]
      }
      if (action) {
        if (!_.isArray(this.actions)) this.actions = []
        this.actions.push(action)
        this.#queue.push(action)
      }
    })

    this.#next = async (args?: any) => {
      const result = await this.#gen?.next(args)
      this.#current = result?.value?.action
      return result
    }
  }

  // NOTE: This is an async generator function!
  async *getExecutor({ event }: { event?: Event } = {}) {
    let args: { action: Action<any>; result?: any } | undefined
    let callerResult
    let file: File | undefined
    let nextAction: Action<any> | undefined
    let results: any[] = []

    while (this.#queue.length) {
      nextAction = this.#queue.shift()
      args = { ...args, action: nextAction as Action<any> }
      if (callerResult) args['result'] = callerResult
      callerResult = await (yield args)
      results.push({ action: nextAction, result: callerResult })
    }

    // Reset the action chain once its done
    this.#refresh()

    return results
  }

  build(
    buildOptions: Pick<
      T.ActionChainActionCallbackOptions,
      'context' | 'parser'
    >,
  ) {
    return (event: Event) => {
      return new Promise((resolve, reject) => {
        this.#setStatus('in.progress')

        if (this.#queue.length) {
          // if (this.need)
          this.#gen = this.getExecutor({ event, ...buildOptions })

          let action: Action<any> | undefined
          let result: any
          let init: { next: (...args: any) => Promise<any> }
          let iterator:
            | IteratorResult<any, any>
            | IteratorReturnResult<any>
            | IteratorYieldResult<any>
            | undefined
          let handlerOptions = this.getCallbackOptions(
            _.assign({}, event, buildOptions),
          )

          const onChainStartArgs = this.onChainStart?.<Action<any>[]>(
            this.#queue,
            handlerOptions,
          )

          // Merge in additional args if any of the actions expect some extra
          // context/data (ex: having file/blobs ready before running the chain)
          if (onChainStartArgs && onChainStartArgs instanceof Promise) {
            // TODO: Find out why I did this "init" part
            init = {
              next: async () => {
                const args = await onChainStartArgs
                const iteratorResult = await this.#gen?.next(args)
                return iteratorResult
              },
            }
          } else {
            init = { next: this.#gen.next }
          }

          return this.#gen
            .next()
            .then(async (iteratorResult) => {
              iterator = iteratorResult

              while (!iterator?.done) {
                action = iterator?.value?.action

                // Skip to the next loop
                if (!action) {
                  iterator = await this.#next()
                }
                // Goto action (will replace the soon-to-be-deprecated actionType: pageJump action)
                else {
                  result = await this.#executeAction(action, handlerOptions)
                  if (result) {
                    if (action.type) log.func(action.type)
                    log.green(
                      'Received a returned value from an executor',
                      result,
                    )
                  }
                }
                // TODO: This will be deprecated in favor of passing this.abort
                if (result === 'abort') {
                  iterator = await this.abort(
                    `"abort" was called from an action with actionType: "${
                      action?.type
                    }". ${JSON.stringify(action)}`,
                  )
                } else if (_.isString(result)) {
                  // TODO
                } else if (_.isFunction(result)) {
                  // TODO
                  iterator = await this.#next(result)
                } else {
                  // TODO
                  iterator = await this.#next(result)
                }
              }

              this.onChainEnd?.(this.actions as Action<any>[], handlerOptions)
              this.#setStatus('done')
              resolve(iterator)
            })
            .catch((err: Error) => {
              this.onChainError?.(
                err,
                this.#current,
                this.getCallbackOptions({ event, error: err, ...buildOptions }),
              )
              this.#setStatus({ error: err })
              reject(err)
            })
        } else {
          // TODO
          const logMsg = `%c[ActionChain] NOTHING HAPPENED`
          const logStyle = `color:#ec0000;font-weight:bold;`
          // console.info(logMsg, logStyle)
          this.abort(
            `The value of "actions" given to this action chain was null or undefined`,
          )
        }
      })
    }
  }

  /**
   * Returns options that will be passed into each action callback in the action chain
   * The current snapshot is also included in the result
   * @param { object } args
   */
  getCallbackOptions(options?: {
    error?: Error
    event?: Event
    parser?: T.RootsParser
    omit?: string | string[]
    include?: { [key: string]: any }
  }): T.ActionChainCallbackOptions<Action<any>[]> {
    const { omit, include, ...rest } = options || {}
    const callbackOptions = {
      abort: this.abort.bind(this),
      snapshot: this.getSnapshot(),
      ...rest,
      ...include,
    } as T.ActionChainCallbackOptions<Action<any>[]>

    if (omit) {
      return _.omit(callbackOptions, omit) as T.ActionChainCallbackOptions<
        Action<any>[]
      >
    }
    return callbackOptions
  }

  /** Returns a snapshot of the current state in the action chain process */
  getSnapshot(): T.ActionChainSnapshot<Action<any>[]> {
    return {
      currentAction: (this.#current as Action<any>) || null,
      original: this.#original,
      queue: [...this.#queue],
      status: this.status,
    }
  }

  async abort(reason?: string | string[]) {
    const reasons: string[] = reason
      ? _.isArray(reason)
        ? reason
        : [reason]
      : []

    this.#setStatus({
      aborted: reasons.length ? { reasons } : true,
    })

    log.func('abort')
    log.orange('Aborting...', { status: this.status })

    // Exhaust the remaining actions in the queue and abort them
    while (this.#queue.length) {
      const action = this.#queue.shift()
      if (action?.status !== 'aborted') {
        try {
          action?.abort(reason || '')
          log.grey(
            `Aborted action of type ${action?.type || '<Missing action type>'}`,
            action,
          )
        } catch (error) {}
      }
    }
    // This will return an object like { value, done: true }
    const abortResult = await this.#gen?.return(reasons.join(', '))
    if (this.onChainAborted) {
      await this.onChainAborted?.(
        this.#current,
        this.getCallbackOptions({ omit: 'abort', include: { abortResult } }),
      )
    }
    this.#refresh()
    return abortResult
  }

  #setStatus = (status: T.ActionChainStatus) => {
    this.status = status
    return this
  }

  #refresh = () => {
    this.actions = []
    this.init(this.#original, this.#getConstructorOptions())
    return this
  }
}

export default ActionChain
