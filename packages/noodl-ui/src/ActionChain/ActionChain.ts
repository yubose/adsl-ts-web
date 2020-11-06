import _ from 'lodash'
import Logger from 'logsnap'
import * as T from '../types'
import Action from '../Action'
import { AbortExecuteError } from '../errors'
import BuiltIn from '../BuiltIn'

const log = Logger.create('ActionChain')

class ActionChain implements T.IActionChain {
  #current: Action<any> | null | undefined
  #executeAction: <OriginalAction extends T.NOODLActionObject>(
    action: Action<OriginalAction>,
    args: T.ActionChainCallbackOptions<Action<any>[]>,
  ) => any
  #original: T.NOODLActionObject[]
  #queue: Action<any>[] = []
  #gen: AsyncGenerator<any, any> | null = null
  #getConstructorArgs: () => T.IActionChainOptions & {
    actions: T.NOODLActionObject[] | undefined
  }
  actions: Action<any>[] | null = null
  intermediary: Action<any>[] = []
  current: {
    action: Action<any> | undefined
    index: number
  }
  status: null | T.ActionChainStatus = null
  #builtIn: { [funcName: string]: T.IBuiltIn[] } = {}
  evalObject?: T.OnEvalObject[]
  pageJump?: T.OnPageJump[]
  popUp?: T.OnPopup[]
  popUpDismiss?: T.OnPopupDismiss[]
  saveObject?: T.OnSaveObject[]
  updateObject?: T.OnUpdateObject[]
  onBuiltinMissing?: T.LifeCycleListeners['onBuiltinMissing']
  onChainStart?: T.LifeCycleListeners['onChainStart']
  onChainEnd?: T.LifeCycleListeners['onChainEnd']
  onChainError?: T.LifeCycleListeners['onChainError']
  onChainAborted?: T.LifeCycleListeners['onChainAborted']
  onAfterResolve?: T.LifeCycleListeners['onAfterResolve']

  constructor(
    actions?: T.NOODLActionObject[],
    options?: T.IActionChainOptions,
  ) {
    this.#original = actions || []

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

    this.#getConstructorArgs = () => ({ actions, ...options })
    this.getDebugArgs = () => ({
      constructorArgs: this.#getConstructorArgs(),
      queue: this.#queue,
      actions: this.actions,
      instance: this,
    })
  }

  get builtIn() {
    return this.#builtIn
  }

  add(actionObj: T.IActionChainAddActionObject): this
  add(builtIn: T.IBuiltIn): this
  add(builtIn: (T.IActionChainAddActionObject | T.IBuiltIn)[]): this
  add(
    obj:
      | T.IActionChainAddActionObject
      | T.IBuiltIn
      | (T.IActionChainAddActionObject | T.IBuiltIn)[],
  ) {
    const onAdd = (item: T.IActionChainAddActionObject | T.IBuiltIn) => {
      if (item instanceof BuiltIn) {
        if (!_.isArray(this.builtIn[item.funcName])) {
          this.builtIn[item.funcName] = []
        }
        this.builtIn[item.funcName].push(item as T.IBuiltIn)
      } else if ('actionType' in item) {
        // TODO - Deprecate this since we introduced the BuiltIn class
        if (item.actionType === 'builtIn') {
          // console.log(item)
        } else {
          if (!_.isArray(this[item.actionType])) this[item.actionType] = []
          this[item.actionType] = this[item.actionType].concat(item.fns)
        }
      }
    }
    _.forEach(_.isArray(obj) ? obj : [obj], (o) => onAdd(o))
    return this
  }

  /**
   * Creates and returns a new Action instance
   * @param { object } obj - Action object
   */
  createAction(obj: T.NOODLActionObject) {
    const action = new Action(obj, {
      timeoutDelay: 8000,
    })
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
    this.#refresh()
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

              while (!iterator?.done) {
                action = iterator?.value?.action
                // Skip to the next loop
                if (!action) {
                  iterator = await this.#next()
                }
                // Goto action (will replace the soon-to-be-deprecated actionType: pageJump action)
                else {
                  result = await this.#executeAction(action, handlerOptions)

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
                  } else if (_.isFunction(result)) {
                    // TODO
                  } else {
                    iterator = await this.#next(result)
                  }

                  if (result) {
                    if (action.type) log.func(action.type)
                    log.green(
                      `Received a returned value from a(n) "${action.type}" executor`,
                      result,
                    )
                  }
                }

                // // TODO: This will be deprecated in favor of passing this.abort
                // if (result === 'abort') {
                //   iterator = await this.abort(
                //     `"abort" was called from an action with actionType: "${
                //       action?.type
                //     }". ${JSON.stringify(action)}`,
                //   )
                // } else if (_.isPlainObject(result)) {
                //   iterator = await this.#next(result)
                // } else if (_.isString(result)) {
                //   // TODO
                // } else if (_.isFunction(result)) {
                //   // TODO
                // } else {
                //   // TODO
                //   iterator = await this.#next(result)
                // }
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
              log.func('build')
              log.grey(`Refreshed action chain`, {
                instance: this,
                snapshot: this.getSnapshot(),
              })
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
    const { value: abortResult = '' } =
      (await this.#gen?.return(reasons.join(', '))) || {}
    if (this.onChainAborted) {
      await this.onChainAborted?.(
        this.#current,
        this.getCallbackOptions({
          omit: 'abort',
          include: { abortResult },
        }),
      )
    }
    this.#refresh()
    log.grey(`Refreshed action chain`, {
      instance: this,
      snapshot: this.getSnapshot(),
    })
    throw new Error(abortResult)
    // return abortResult
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
    this.actions = []
    if (this.#queue.length) this.#queue = []

    _.forEach(this.#getConstructorArgs().actions || [], (actionObj) => {
      // Temporarily hardcode the actionType to blend in with the other actions
      // for now until we find a better solution
      // @ts-expect-error
      if (actionObj.goto) {
        actionObj = { ...actionObj, actionType: 'goto' } as any
      }
      const action = this.createAction(actionObj)
      if (action) {
        const executors =
          action.actionType === 'builtIn'
            ? (this.builtIn?.[action.funcName] as T.IBuiltIn[])
            : (this[action.actionType] as T.ActionChainActionCallback[])

        if (_.isArray(executors)) {
          const numExecutors = executors.length
          const promises = [] as ((...args: any[]) => any | Promise<any>)[]
          for (let index = 0; index < numExecutors; index++) {
            const executor = executors[index]
            if (executor instanceof BuiltIn) {
              promises.push(executor.execute)
            } else {
              promises.push(executor as T.ActionChainActionCallback)
            }
          }
          action['callback'] = async (...args: any[]) => {
            for (let index = 0; index < promises.length; index++) {
              const promise = promises[index]
              const result = await promise(...args)
              if (result) log.gold('Received result from an action', result)
            }
          }
        } else if (_.isFunction(executors)) {
          action['callback'] = executors
        } else {
          log.func('#refresh')
          log.red(
            `Tried to attach a callback to an action of actionType ` +
              `"${action.actionType}" but did not find any functions`,
            {
              createActionParams: actionObj,
              createdAction: action,
              executorsReceived: executors,
              instance: this,
            },
          )
        }

        this.actions?.push(action)
        this.#queue.push(action)
      }
    })
    return this
  }
}

export default ActionChain
