import _ from 'lodash'
import Logger from 'logsnap'
import Action from '../Action'
import { AbortExecuteError } from '../errors'
import { createExecute, createExecutor } from './execute'
import * as T from '../types'

const log = Logger.create('ActionChain')

class ActionChain<ActionType extends string> implements T.IActionChain {
  #current: T.IAction | undefined
  #original: T.NOODLActionObject[]
  #queue: T.IAction[] = []
  #gen: AsyncGenerator<{
    action: T.IAction[] | undefined
    results: any[]
  }>
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
  }

  useAction(action: T.IActionChainUseObject<ActionType>): this
  useAction(action: T.IActionChainUseObject<ActionType>[]): this
  useAction(action: T.IActionChainUseObject | T.IActionChainUseObject[]) {
    const actions = _.isArray(action) ? action : [action]
    // Built in actions are forwarded to this.useBuiltIn
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
    log.func('createAction')
    log.gold('', {
      actionObj: obj,
      instance: this,
      queue: this.#queue,
    })
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
      // Let anonymous funcs pass by silently
      if (action.actionType === 'anonymous') {
        if ('fn' in action.original) {
          result = await action.original.fn(...args)
        }
      } else {
        if (action.actionType === 'builtIn') {
          fns =
            this.fns.builtIn[
              (action?.original as T.IActionChainUseBuiltInObject)?.funcName
            ] || []
        } else {
          log.grey(`Non-builtin action encountered`, { action, actionObj: obj })
          fns = this.fns.action[action.actionType] || []
        }
        if (!fns) return result
        result = await runFns(args, fns)
      }
      return result
    }

    return action as T.IAction
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
    const loadQueue = () => {
      log.func('loadQueue')
      if (this.actions?.length) {
        log.func('build')
        log.grey(`Refreshing action chain`, this)
      }
      this.actions = []
      this.#queue = _.reduce(
        this.#original,
        (acc, actionObj: T.NOODLActionObject | Function) => {
          let action: T.IAction | undefined

          if (_.isFunction(actionObj)) {
            log.red(
              `Encountered an action object that is not an object type.` +
                `This action will be invoked anonymously when the action chain runs`,
              { received: actionObj },
            )
            action = this.createAction({
              actionType: 'anonymous',
              fn: actionObj,
            })
          }
          // Temporarily hardcode the actionType to blend in with the other actions
          // for now until we find a better solution
          if (typeof actionObj !== 'function') {
            if ('emit' in actionObj) {
              actionObj = { ...actionObj, actionType: 'emit' } as any
            } else if ('goto' in actionObj) {
              actionObj = { ...actionObj, actionType: 'goto' } as any
            }
            action = this.createAction(actionObj as T.NOODLActionObject)
          }
          if (action) {
            this.actions?.push(action)
            log.grey(
              `Loaded a(n) "${action.actionType}" action into the queue`,
              action,
            )

            return acc.concat(action)
          }
          return acc
        },
        [] as T.IAction[],
      )
      return this.#queue
    }

    const queue = loadQueue()
    this.#gen = createExecutor(queue)

    const executeActions = createExecute({
      executor: this.#gen,
      getCallbackArgs: (arg: any) =>
        this.getCallbackOptions({ arg, ...buildOptions }),
      next: this.#next,
      queue,
      onStart: () => {
        this.#setStatus('in.progress')
        log.func('onStart')
        log.grey('Action chain started', {
          queue,
          ...this.getCallbackOptions(buildOptions),
        })
      },
      onEnd: () => {
        this.#setStatus('done')
        log.func('onEnd')
        log.grey('Action chain ended')
        loadQueue()
      },
      onError: (error: Error) => {
        console.error(error.message)
        this.#setStatus({ error })
        log.func('onError')
        log.red(`[ERROR]: An action chain received an error`, { error, queue })
      },
    })

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

    return executeActions(execute)
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
      (await this.#gen?.return?.(reasons.join(', '))) || {}
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

  #next = async (gen, args?: any) => {
    const result = (await gen?.next(args)) as
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
