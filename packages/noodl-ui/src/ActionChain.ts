import _ from 'lodash'
import Logger from 'logsnap'
import { isAction } from 'noodl-utils'
import * as T from './types'
import Action from './Action'
import { forEachEntries } from './utils/common'
import { AbortExecuteError } from './errors'

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
  parser?: T.ResolverOptions['parser']
}

class ActionChain {
  #current: Action<any> | null | undefined
  #executeAction: <OriginalAction extends T.NOODLActionObject>(
    action: Action<OriginalAction>,
    args: T.ActionChainCallbackOptions<Action<any>[]>,
  ) => any
  #original: T.NOODLActionObject[]
  #queue: Action<any>[] = []
  #gen: AsyncGenerator<any, any> | null = null
  #getConstructorOptions: () => ActionChainOptions | undefined
  actions: Action<any>[] | null = null
  intermediary: Action<any>[] = []
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

  constructor(actions?: T.NOODLActionObject[], options?: ActionChainOptions) {
    if (actions) {
      this.init(actions, options)
    }

    let timeoutRef: NodeJS.Timeout

    this.#executeAction = async <OriginalAction extends T.NOODLActionObject>(
      action: Action<OriginalAction>,
      handlerOptions: T.ActionChainCallbackOptions<Action<any>[]>,
    ) => {
      try {
        if (timeoutRef) clearTimeout(timeoutRef)

        timeoutRef = setTimeout(() => {
          const msg = `Action of type "${action.type}" timed out`
          action.abort(msg)
          this.abort(msg)
          throw new AbortExecuteError(msg)
        }, 10000)

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

  init(actions: T.NOODLActionObject[], options?: ActionChainOptions) {
    // Append the listeners to this instance
    if (options) {
      const { parser, ...opts } = options

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
      //  logic "if" condition in action chains
      const action = this.createAction(actionObject)
      if (action) {
        if (!_.isArray(this.actions)) this.actions = []
        this.actions.push(action)
        this.#queue.push(action)
      }
    })
  }

  /**
   * Creates and returns a new Action instance
   * @param { object } obj - Action object
   */
  createAction(obj: T.NOODLActionObject) {
    const action = new Action(obj, {
      timeoutDelay: 8000,
    })
    if (obj.actionType === 'builtIn') {
      const builtInFn = this.builtIn?.[obj.funcName]
      if (_.isFunction(builtInFn)) {
        action.callback = builtInFn
      }
    } else {
      action.callback = this[obj.actionType]
    }
    return action
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
      // TODO - callerResult could be an intermediary action object now
      if (_.isPlainObject(callerResult)) {
        // TODO - Do a better way to identify the action
        const { actionType = '' } = callerResult
        if (actionType) {
          // We may get an action object returned back like from
          // evalObject. If this is the case we need to immediately
          // run this action before continuing
          // Start up a new Action with this object and inject it
          // as the first item in the queued actions
          const intermediaryAction = this.createAction(callerResult)
          this.intermediary.push(intermediaryAction)
          this.#queue = [intermediaryAction, ...this.#queue]
        }
      }
      results.push({ action: nextAction, result: callerResult })
    }

    // Reset the action chain once its done
    // this.#refresh()

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

          log.gold('onChainStartArgs', {
            onChainStartArgs,
            handlerOptions,
            event,
            action,
          })

          // Merge in additional args if any of the actions expect some extra
          // context/data (ex: having file/blobs ready before running the chain)
          if (onChainStartArgs && onChainStartArgs instanceof Promise) {
            // TODO: Find out why I did this "init" part
            init = {
              next: async () => {
                log.red(`REMINDER: LOOK INTO THIS IF U SEE THIS!!!!!!`, {
                  onChainStartArgs,
                  actionChain: this,
                  buildOptions,
                })
                const argsResult = await onChainStartArgs
                await this.#gen?.next(argsResult)
              },
            }
          } else {
            init = { next: this.#gen.next }
          }

          return init.next
            .call(this.#gen)
            .then(async (iteratorResult: any) => {
              iterator = iteratorResult

              log.gold('init.next [before]', {
                iteratorResult,
                action,
                handlerOptions,
                result,
              })

              while (!iterator?.done) {
                action = iterator?.value?.action
                log.gold('init.next [during]', {
                  iteratorResult,
                  action,
                  handlerOptions,
                  result,
                })

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
                      `Received a returned value from a(n) "${action.type}" executor`,
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
                } else if (_.isPlainObject(result)) {
                  iterator = await this.#next(result)
                } else if (_.isString(result)) {
                  // TODO
                } else if (_.isPlainObject(result)) {
                  // Check if the result is an action noodl object
                  if (isAction(result)) {
                    result = new Action(result)
                    // Its possible to receive back some noodl action object.
                    // This most likely came from some "if" condition and wants
                    // us to handle it immediately. So inject it immediately to
                    // the first position in the queue for the generator
                    this.#queue = [result, ...this.getQueue()]
                    iterator = await this.#next()
                  } else {
                    // TODO
                  }
                } else if (_.isFunction(result)) {
                  // TODO
                } else {
                  // TODO
                  iterator = await this.#next(result)
                }
              }

              log.gold('init.next [after]', {
                iteratorResult,
                action,
                handlerOptions,
                result,
              })

              this.onChainEnd?.(this.actions as Action<any>[], handlerOptions)
              this.#setStatus('done')
              this.#refresh()
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

  /** Returns the current queue */
  getQueue() {
    return [...this.#queue]
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

    if (this.#current) this.#queue.unshift(this.#current)

    // Exhaust the remaining actions in the queue and abort them
    while (this.#queue.length) {
      const action = this.#queue.shift()
      log.grey(`Aborting action ${action?.type}`, action?.getSnapshot())
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

  #next = async (args?: any) => {
    const result = await this.#gen?.next(args)
    this.#current = result?.value?.action
    return result
  }

  #setStatus = (status: T.ActionChainStatus) => {
    this.status = status
    return this
  }

  #refresh = () => {
    log.func('#refresh')
    log.grey(`Refreshed action chain`, {
      instance: this,
      snapshot: this.getSnapshot(),
    })
    this.actions = []
    this.init(this.#original, this.#getConstructorOptions())
    return this
  }
}

export default ActionChain
