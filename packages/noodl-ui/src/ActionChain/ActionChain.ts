import _ from 'lodash'
import Logger from 'logsnap'
import Action from '../Action'
import { AbortExecuteError } from '../errors'
import * as T from '../types'

const log = Logger.create('ActionChain')

class ActionChain<ActionType extends string> implements T.IActionChain {
  #current: T.IAction | undefined
  #executeAction: (
    action: T.IAction,
    args: T.ActionChainCallbackOptions<T.IAction[]>,
  ) => any
  #original: T.NOODLActionObject[]
  #queue: T.IAction[] = []
  #gen: AsyncGenerator<any, any> | null = null
  actions: T.IAction[] | null = null
  fns: T.IActionChain['fns'] = { action: {}, builtIn: {} }
  intermediary: T.IAction[] = []
  current: {
    action: T.IAction | undefined
    index: number
  }
  status: null | T.ActionChainStatus = null
  // onBuiltinMissing?: T.LifeCycleListeners['onBuiltinMissing']
  // onChainStart?: T.LifeCycleListeners['onChainStart']
  // onChainEnd?: T.LifeCycleListeners['onChainEnd']
  // onChainError?: T.LifeCycleListeners['onChainError']
  // onChainAborted?: T.LifeCycleListeners['onChainAborted']
  // onAfterResolve?: T.LifeCycleListeners['onAfterResolve']

  constructor(actions?: T.NOODLActionObject[]) {
    this.#original = actions || []

    let timeoutRef: NodeJS.Timeout

    this.#executeAction = async (action, handlerOptions) => {
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
  }

  useAction(action: T.IActionChainUseObject<ActionType>): this
  useAction(action: T.IActionChainUseObject<ActionType>[]): this
  useAction(action: T.IActionChainUseObject | T.IActionChainUseObject[]) {
    const actions = _.isArray(action) ? action : [action]
    // Built in actions are sent to this.useBuiltIn
    _.forEach(actions, (a) => {
      if ('funcName' in a) return void this.useBuiltIn(a)
      const actionsList = this.fns.action[a.actionType] || []
      this.fns.action[a.actionType] = actionsList.concat(
        _.isArray(a.fn) ? a.fn : [a.fn],
      )
    })
    return this
  }

  useBuiltIn(
    action: T.IActionChainUseBuiltInObject | T.IActionChainUseBuiltInObject[],
  ) {
    const actions = (_.isArray(action)
      ? action
      : [action]) as T.IActionChainUseBuiltInObject[]

    _.forEach(actions, (a) => {
      const { funcName } = a
      const currentFns = this.fns.builtIn[funcName] || []
      this.fns.builtIn[funcName] = currentFns.concat(
        _.reduce(
          actions,
          (acc, a) => acc.concat(_.isArray(a.fn) ? a.fn : [a.fn]),
          [] as T.ActionChainActionCallback[],
        ),
      )
    })

    return this
  }

  /**
   * Creates and returns a new Action instance
   * @param { object } obj - Action object
   */
  createAction(obj: T.NOODLActionObject): T.IAction {
    const action = new Action(obj, {
      timeoutDelay: 8000,
    }) as T.IAction

    const runFns = async (
      args: Parameters<T.ActionChainActionCallback>,
      fns: T.ActionChainActionCallback[],
    ) => {
      const numFuncs = fns.length
      for (let index = 0; index < numFuncs; index++) {
        const fn = fns[index]
        const result = await fn(...args)
        // TODO - Do a better way to identify the action
        if ((result || ({} as T.NOODLActionObject)).actionType) {
          // We may get an action object returned back like from
          // evalObject. If this is the case we need to immediately
          // run this action before continuing
          // Start up a new Action with this object and inject it
          // as the first item in the queued actions
          const intermediaryAction = this.createAction(result)
          this.intermediary.push(intermediaryAction)
          this.#queue = [intermediaryAction, ...this.#queue]
        }
      }
    }

    let fns: any[]
    let result: any

    action['callback'] = async (
      ...args: Parameters<T.ActionChainActionCallback>
    ) => {
      if (action.actionType === 'builtIn') {
        fns =
          this.fns.builtIn[
            (action?.original as T.IActionChainUseBuiltInObject)?.funcName
          ] || []
      } else {
        fns = this.fns.action[action.actionType] || []
      }
      if (!fns) return result
      result = await runFns(args, fns)
      return result
    }

    return action as T.IAction
  }

  // NOTE: This is an async generator
  async *getExecutor() {
    let action: T.IAction | undefined
    let results: any[] = []

    while (this.#queue.length) {
      action = this.#queue.shift()
      results.push({ action, result: await (yield { action, results }) })
    }

    return results
  }

  build(
    buildOptions: Pick<
      T.ActionChainActionCallbackOptions,
      'context' | 'parser'
    >,
  ) {
    /**
     * Load up the queue and the actions list
     * The actions in the queue are identical to the ones in this.actions
     * The only difference is that the actions will be removed from the queue
     * as soon as they are done executing
     */
    if (this.actions?.length) {
      log.func('build')
      log.grey(`Refreshing action chain`, this)
    }
    this.actions = []
    this.#queue = this.#original.map((actionObj) => {
      // Temporarily hardcode the actionType to blend in with the other actions
      // for now until we find a better solution
      // @ts-expect-error
      if (actionObj.goto) {
        actionObj = { ...actionObj, actionType: 'goto' } as any
      }
      const action = this.createAction(actionObj)
      this.actions?.push(action)
      return action
    })

    const fn = (event?: Event) => {
      return new Promise((resolve, reject) => {
        this.#setStatus('in.progress')

        if (this.#queue.length) {
          this.#gen = this.getExecutor()

          let action: T.IAction | undefined
          let result: any
          let iterator:
            | IteratorYieldResult<{
                action: T.IAction
                results: any[]
              }>
            | undefined

          return this.#gen
            .next()
            .then(
              async (
                iteratorResult: IteratorYieldResult<{
                  action: T.IAction
                  results: any[]
                }>,
              ) => {
                iterator = iteratorResult

                while (!iterator?.done) {
                  action = iterator?.value?.action
                  // Skip to the next loop
                  if (!action) {
                    iterator = await this.#next()
                  }
                  // Goto action (will replace the soon-to-be-deprecated actionType: pageJump action)
                  else {
                    result = await this.#executeAction(
                      action,
                      this.getCallbackOptions({ event, ...buildOptions }),
                    )
                    if (_.isPlainObject(result)) {
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
                }
                // this.onChainEnd?.(
                //   this.actions as T.IAction[],
                //   this.getCallbackOptions({ event, ...buildOptions }),
                // )
                this.#setStatus('done')
                resolve(iterator)
              },
            )
            .catch((err: Error) => {
              // this.onChainError?.(
              //   err,
              //   this.#current,
              //   this.getCallbackOptions({ event, error: err, ...buildOptions }),
              // )
              this.#setStatus({ error: err })
              reject(err)
            })
        } else {
          // TODO more handling
          this.abort(
            `The value of "actions" given to this action chain was null or undefined`,
          )
        }
      })
    }

    return fn
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
  }): T.ActionChainCallbackOptions<T.IAction[]> {
    const { omit, include, ...rest } = options || {}
    const callbackOptions = {
      abort: this.abort.bind(this),
      snapshot: this.getSnapshot(),
      ...rest,
      ...include,
    } as T.ActionChainCallbackOptions<T.IAction[]>

    if (omit) {
      return _.omit(callbackOptions, omit) as T.ActionChainCallbackOptions<
        T.IAction[]
      >
    }
    return callbackOptions
  }

  /** Returns the current queue */
  getQueue() {
    return [...this.#queue]
  }

  /** Returns a snapshot of the current state in the action chain process */
  getSnapshot(): T.ActionChainSnapshot<T.IAction[]> {
    return {
      currentAction: (this.#current as T.IAction) || null,
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
    // if (this.onChainAborted) {
    // await this.onChainAborted?.(
    //   this.#current,
    //   this.getCallbackOptions({
    //     omit: 'abort',
    //     include: { abortResult },
    //   }),
    // )
    // }
    log.grey(`Refreshed action chain`, {
      instance: this,
      snapshot: this.getSnapshot(),
    })
    // throw new Error(abortResult)
    // return abortResult
  }

  #next = async (args?: any) => {
    const result = (await this.#gen?.next(args)) as
      | IteratorYieldResult<{
          action: T.IAction
          results: any[]
        }>
      | undefined
    this.#current = result?.value?.action
    return result
  }

  #setStatus = (status: T.ActionChainStatus) => {
    this.status = status
    return this
  }
}

export default ActionChain
