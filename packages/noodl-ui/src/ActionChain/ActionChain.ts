import _ from 'lodash'
import Logger from 'logsnap'
import * as T from '../types'
import Action from '../Action'
import BuiltIn from '../BuiltIn'
import { AbortExecuteError } from '../errors'

const log = Logger.create('ActionChain')

class ActionChain implements T.IActionChain {
  #current: T.IAction | undefined
  #executeAction: (
    action: T.IAction,
    args: T.ActionChainCallbackOptions<T.IAction[]>,
  ) => any
  #original: T.NOODLActionObject[]
  #queue: T.IAction[] = []
  #gen: AsyncGenerator<any, any> | null = null
  #getConstructorArgs: () => T.IActionChainOptions & {
    actions: T.NOODLActionObject[] | undefined
  }
  actions: T.IAction[] | null = null
  intermediary: T.IAction[] = []
  current: {
    action: T.IAction | undefined
    index: number
  }
  status: null | T.ActionChainStatus = null
  #builtIn: { [funcName: string]: T.IBuiltIn[] } = {}
  evalObject?: T.OnEvalObject[] = []
  pageJump?: T.OnPageJump[] = []
  popUp?: T.OnPopup[] = []
  popUpDismiss?: T.OnPopupDismiss[] = []
  saveObject?: T.OnSaveObject[] = []
  updateObject?: T.OnUpdateObject[] = []
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
    _.forEach(_.isArray(obj) ? obj : [obj], (item) => {
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
      args: any[],
      fns: ((...args: any[]) => Promise<any>)[],
    ) => {
      const numFuncs = fns.length
      for (let index = 0; index < numFuncs; index++) {
        const fn = fns[index]
        const result = await fn(...args)
        // TODO - Do a better way to identify the action
        if ((result || {})?.actionType) {
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

    action['callback'] = async (...args: any[]) => {
      if (action.actionType === 'builtIn' || action instanceof BuiltIn) {
        fns = this.#builtIn[(action as any)?.funcName]
      } else {
        fns = this[action.actionType]
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
          // if (this.need)
          this.#gen = this.getExecutor()

          let action: T.IAction | undefined
          let result: any
          let init: { next: (...args: any) => Promise<any> }
          let iterator:
            | IteratorYieldResult<{
                action: T.IAction
                results: any[]
              }>
            | undefined
          let handlerOptions = this.getCallbackOptions(
            _.assign({}, event, buildOptions),
          )

          const onChainStartArgs = this.onChainStart?.<T.IAction[]>(
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
                    result = await this.#executeAction(action, handlerOptions)
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

                this.onChainEnd?.(this.actions as T.IAction[], handlerOptions)
                this.#setStatus('done')
                log.func('build')
                log.grey(`Refreshed action chain`, {
                  instance: this,
                  snapshot: this.getSnapshot(),
                })
                resolve(iterator)
              },
            )
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
    if (this.onChainAborted) {
      await this.onChainAborted?.(
        this.#current,
        this.getCallbackOptions({
          omit: 'abort',
          include: { abortResult },
        }),
      )
    }
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
