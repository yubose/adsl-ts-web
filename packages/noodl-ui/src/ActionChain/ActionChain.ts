import _ from 'lodash'
import Logger from 'logsnap'
import Action from '../Action'
import { AbortExecuteError } from '../errors'
import * as T from '../types'

const log = Logger.create('ActionChain')

class ActionChain<ActionType extends string> implements T.IActionChain {
  #current: T.IAction | undefined
  #original: T.NOODLActionObject[]
  #queue: T.IAction[] = []
  #gen: AsyncGenerator<any, any> | null = null
  actions: T.IAction[] | null = null
  emitter: T.IActionChain['emitter']
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

  constructor(
    actions?: T.NOODLActionObject[],
    { emitter }: { emitter?: T.IActionChain['emitter'] } = {},
  ) {
    this.#original = actions || []
    if (emitter) this['emitter'] = this.createEmitter(emitter) || null
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
        _.isArray(a.fn) ? a.fn : [a.fn],
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
      } else if (action.actionType === 'emit') {
        if (this.emitter) fns = [this.emitter]
      } else {
        fns = this.fns.action[action.actionType] || []
      }
      if (!fns) return result
      result = await runFns(args, fns)
      return result
    }

    return action as T.IAction
  }

  createEmitter<F extends T.ActionEmitter>(fn: F | undefined) {
    let emitter
    if (fn) {
      emitter = ({ emit }: T.NOODLEmitObject) => fn(emit)
    }
    return emitter
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
    this.#queue = this.#original.map((actionObj: any) => {
      // Temporarily hardcode the actionType to blend in with the other actions
      // for now until we find a better solution
      if (actionObj.emit) {
        actionObj = { ...actionObj, actionType: 'emit' } as any
      } else if (actionObj.goto) {
        actionObj = { ...actionObj, actionType: 'goto' } as any
      }
      const action = this.createAction(actionObj)
      this.actions?.push(action)
      return action
    })

    // NOTE: This is an async generator
    async function* getExecutor() {
      let action: T.IAction | undefined
      let results: any[] = []

      while (this.#queue.length) {
        action = this.#queue.shift()
        results.push({ action, result: await (yield { action, results }) })
      }

      return results
    }

    let timeoutRef: NodeJS.Timeout

    const execute = async (
      action: T.IAction,
      handlerOptions: T.ActionChainActionCallbackOptions,
    ) => {
      try {
        if (timeoutRef) clearTimeout(timeoutRef)

        timeoutRef = setTimeout(() => {
          const msg = `Action of type "${action.type}" timed out`
          action.abort(msg)
          this.abort(msg)
          throw new AbortExecuteError(msg)
        }, 10000)

        return action.execute(handlerOptions)
      } catch (error) {
        throw error
      } finally {
        clearTimeout(timeoutRef)
      }
    }

    const executeActions = async (event?: Event) => {
      try {
        this.#setStatus('in.progress')

        if (this.#queue.length) {
          this.#gen = getExecutor.call(this)

          let action: T.IAction | undefined
          let result: any
          let iterator:
            | IteratorYieldResult<{
                action: T.IAction
                results: any[]
              }>
            | IteratorReturnResult<{
                action: T.IAction
                results: any[]
              }>
            | undefined = await this.#gen?.next()

          while (!iterator?.done) {
            action = iterator?.value?.action
            // Skip to the next loop
            if (!action) {
              iterator = await this.#next()
            }
            // Goto action (will replace the soon-to-be-deprecated actionType: pageJump action)
            else {
              result = await execute(
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
        this.#setStatus({ error })
        // TODO more handling
        this.abort(
          `The value of "actions" given to this action chain was null or undefined`,
        )
      }
    }

    return executeActions
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
