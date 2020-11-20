import _ from 'lodash'
import { isDraft, original } from 'immer'
import { findDataObject, findListDataObject, isListConsumer } from 'noodl-utils'
import Logger from 'logsnap'
import Action from '../Action'
import EmitAction from '../Action/EmitAction'
import { AbortExecuteError } from '../errors'
import { createExecute } from './execute'
import { isActionChainEmitTrigger } from '../utils/noodl'
import * as T from '../types'

const log = Logger.create('ActionChain')

class ActionChain<
  ActionObjects extends T.IActionObject[],
  C extends T.IComponentTypeInstance
> implements T.IActionChain<ActionObjects, C> {
  #current: T.IAction | undefined
  #original: T.IActionObject[]
  #gen: AsyncGenerator<{
    action: T.IAction[] | undefined
    results: any[]
  }>
  #queue: T.IAction[] = []
  actions: T.BaseActionObject[] = []
  component: C
  current: {
    action: T.IAction | undefined
    index: number
  }
  fns: T.IActionChain['fns'] = { action: {}, builtIn: {} }
  pageName?: string
  pageObject?: T.NOODLPageObject | null
  intermediary: T.IAction[] = []
  status: T.IActionChain['status'] = null
  trigger: T.IActionChainEmitTrigger | undefined
  // onBuiltinMissing?: T.LifeCycleListeners['onBuiltinMissing']
  // onChainStart?: T.LifeCycleListeners['onChainStart']
  // onChainEnd?: T.LifeCycleListeners['onChainEnd']
  // onChainError?: T.LifeCycleListeners['onChainError']
  // onChainAborted?: T.LifeCycleListeners['onChainAborted']
  // onAfterResolve?: T.LifeCycleListeners['onAfterResolve']

  constructor(
    actions: T.IActionChainConstructorArgs<ActionObjects, C>[0],
    {
      component,
      pageName,
      pageObject,
      trigger,
    }: T.IActionChainConstructorArgs<ActionObjects, C>[1],
  ) {
    this.#original = actions?.map((a) =>
      isDraft(a) ? original(a) : a,
    ) as T.IActionObject[]
    this['actions'] = this.#original
    this['component'] = component
    this['pageName'] = pageName
    this['pageObject'] = pageObject
    this['trigger'] = trigger

    log.func('constructor')
    log.grey('Initiated action objects', {
      actions,
      '#original': this.#original,
      component,
      trigger,
      instance: this,
      fns: this.fns,
    })
  }

  useAction(action: T.IActionChainUseObject): this
  useAction(action: T.IActionChainUseObject[]): this
  useAction(action: T.IActionChainUseObject | T.IActionChainUseObject[]) {
    // Built in actions are forwarded to this.useBuiltIn
    _.forEach(_.isArray(action) ? action : [action], (obj) => {
      if ('funcName' in obj) return void this.useBuiltIn(obj)
      const currentActions = this.fns.action[obj.actionType] || []
      this.fns.action[obj.actionType] = [
        ...currentActions,
        ...(_.isArray(obj) ? obj : ([obj] as any)),
      ]
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
   * NOTE: obj should have an "actionType" by the time of this call
   */
  createAction<A = any>(obj: A) {
    const runActionFuncs = async ({
      callbacks,
      instance,
      options,
    }: {
      callbacks: T.ActionChainActionCallback<ActionObjects>[]
      instance: ActionObjects[number]
      options: Parameters<T.ActionChainActionCallback<ActionObjects>>
    }) => {
      const numFuncs = callbacks.length
      for (let index = 0; index < numFuncs; index++) {
        const fn = callbacks[index]
        const result = await fn(instance, options)
        // TODO - Do a better way to identify the action
        if ((result || ({} as A)).actionType) {
          // We may get an action object returned back like from
          // evalObject. If this is the case we need to immediately
          // run this action before continuing
          // Start up a new Action with this object and inject it
          // as the first item in the queued actions
          const intermediaryAction = this.createAction(result)
          if (intermediaryAction) {
            this.intermediary.push(intermediaryAction)
            this.#queue = [intermediaryAction, ...this.#queue]
          }
        }
      }
    }

    log.gold(obj.actionType, obj)

    let action =
      obj.actionType === 'emit'
        ? new EmitAction(obj as T.EmitActionObject)
        : new Action(obj)
    let conditionalCallbackArgs = {} as any
    let callbacks: any[]

    const attachFn = (_action) => {
      _action['callback'] = async (
        instance: Parameters<
          T.ActionChainActionCallback<ActionObjects[number]>
        >[0],
        options: Parameters<
          T.ActionChainActionCallback<ActionObjects[number]>
        >[1],
      ) => {
        log.func('attachFn')
        log.green('You reached the start of action[callback]', {
          _action,
          callbacks: this.fns.action[obj.actionType] || [],
          actionObj: obj,
          actions: this.actions,
          queue: this.getQueue(),
        })
        const callbackArgs = { ...options, ...conditionalCallbackArgs }
        const logArgs = {
          action: _action,
          callbackArgs,
          originalActionObj: obj,
          instance: this,
          actions: this.actions,
          queue: this.#queue,
        }
        if (action.actionType === 'anonymous') {
          log.grey('Loading anonymous action', logArgs)
          if ('fn' in _action.original) {
            await action.original.fn?.(instance, callbackArgs)
          }
        } else if (action.actionType === 'builtIn') {
          log.grey('Loading builtIn action', logArgs)
          callbacks = this.fns.builtIn[_action?.original?.funcName] || []
          if (!callbacks) return
          await runActionFuncs({ callbacks, instance, options: callbackArgs })
        } else {
          log.gold(`*** Loading ${action.actionType} action`, logArgs)
          callbacks = _.reduce(
            this.fns.action[action.actionType] || [],
            (acc, a) => {
              const isUnrelatedTrigger =
                action.actionType === 'emit' &&
                !isActionChainEmitTrigger(this.trigger)
              if (isUnrelatedTrigger) {
                log.grey(
                  `Discarding unrelated action "${action.actionType}" from the action callback`,
                  {
                    callbacks,
                    ...logArgs,
                  },
                )
                return acc
              }
              log.grey(`Accepting action chain trigger handler`, {
                callbacks,
                ...logArgs,
              })
              return acc.concat(a.fn)
            },
            [],
          )
          log.green('You reached the end of action[callback]', {
            _action,
            callbacks: this.fns.action[obj.actionType] || [],
          })
          console.info('obj', obj)
          console.info('fns', this.fns)
          console.info('callbacks', callbacks)
          await runActionFuncs({ callbacks, instance, options: callbackArgs })
        }
      }
      console.info(obj)
    }

    if (obj.actionType === 'emit') {
      const emitObj = obj as T.EmitActionObject
      const emitAction = action as EmitAction
      emitAction.set('trigger', this.trigger)

      if (_.isPlainObject(emitObj.emit?.dataKey)) {
        const entries = _.entries(emitObj.emit.dataKey)
        const iteratorVar = this.component.get('iteratorVar') || ''
        const isListItemDataObject = _.some(
          _.values(emitObj?.emit?.dataKey),
          (dataKey) => `${dataKey}`.startsWith(iteratorVar),
        )
        if (isListItemDataObject) {
          emitAction.setDataObject(findListDataObject(this.component))
        } else {
          const [property, dataKey] = entries[0]
          emitAction.setDataObject(
            findDataObject({
              dataKey,
              pageObject: this.pageObject,
              root: { [this.pageName || '']: this.pageObject },
            }),
          )
        }
        for (let index = 0; index < entries.length; index++) {
          const [property] = entries[index] || ''
          emitAction.setDataKeyValue(property, emitAction.getDataObject())
        }
      } else if (_.isString(emitObj.emit?.dataKey)) {
        if (isListConsumer(this.component)) {
          emitAction.setDataObject(findListDataObject(this.component))
        } else {
          emitAction.setDataObject(
            findDataObject({
              dataKey: emitObj.emit.dataKey,
              pageObject: this.pageObject,
              root: this.pageName
                ? { [this.pageName]: this.pageObject }
                : this.pageObject || {},
            }),
          )
        }
      }
      attachFn(emitAction)
    } else {
      attachFn(action)
    }

    return action as T.IAction<A>
  }

  build(buildOptions?: T.IActionChainBuildOptions) {
    let isRefreshed

    const refresh = () => {
      this.#queue = []
      log.func('build')
      log.grey(`Refreshed action chain`, {
        actions: this.actions,
        instance: this,
        originalActions: this.#original,
        queue: this.getQueue(),
      })
    }
    /**
     * Load up the queue and the actions list
     * The actions in the queue are identical to the ones in this.actions
     * The only difference is that the actions will be removed from the queue
     * as soon as they are done executing
     */
    const loadQueue = () => {
      _.forEach(
        this.actions,
        (actionObj: T.IActionObject | Function) => {
          let action: T.IAction<ActionObjects[number]> | undefined

          if (_.isFunction(actionObj)) {
            if (!this.fns.action.anonymous?.length) {
              log.red(
                `Encountered an action object that is not an object type. You will` +
                  `need to register an "anonymous" action as an actionType if you want to ` +
                  `handle anonymous functions`,
                { received: actionObj, component: this.component },
              )
            }
            action = this.createAction({
              actionType: 'anonymous',
              fn: actionObj,
            })
          }
          // Temporarily hardcode the actionType to blend in with the other actions
          // for now until we find a better solution
          else {
            log.gold('actionObj', actionObj)
            if ('emit' in actionObj) {
              actionObj = {
                ...actionObj,
                actionType: 'emit',
              } as T.EmitActionObject
              log.gold('registered emit callbacks: ', {
                actionObj,
                fns: this.fns,
                emitCallbacks: this.fns.action[actionObj.actionType],
              })
            } else if ('goto' in actionObj) {
              actionObj = {
                ...actionObj,
                actionType: 'goto',
              } as T.GotoActionObject
            }
            action = this.createAction(actionObj)
          }
          if (action) {
            this.actions?.push(action)
            this.#queue.push(action)
            log.grey(`Loaded "${action.actionType}" action into the queue`, {
              action: action.getSnapshot(),
              actionInstance: action,
              actionChain: this,
              actions: this.actions,
              component: this.component,
              originalActionObj: actionObj,
            })
            // return acc.concat(action)
          }
          // return acc
        },
        // [] as T.IAction<ActionObjects[number]>[],
      )

      this.#gen = createActionChainGenerator(this.#queue)

      return this.#queue
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

    return (args?: any) => {
      return (executeFn) => {
        loadQueue()
        return createExecute({
          ...buildOptions,
          abort: this.abort.bind(this),
          component: this.component,
          executor: this.#gen,
          next: this.#next,
          queue: this.#queue.slice(),
          onStart: () => {
            this.#setStatus('in.progress')
            log.func('onStart')
            log.grey('Action chain started', {
              queue: this.#queue.slice(),
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
            log.red(`[ERROR]: An action chain received an error`, {
              error,
              queue: this.#queue.slice(),
            })
          },
        })(execute)
      }
    }
  }

  /**
   * Returns options that will be passed into each action callback in the action chain
   * The current snapshot is also included in the result
   * @param { object } args
   */
  // @ts-expect-error
  getDefaultCallbackArgs(): ReturnType<
    T.IActionChain['getDefaultCallbackArgs']
  > {
    // @ts-expect-error
    return {
      actions: this.actions,
      component: this.component,
      currentAction: this.#current,
      originalActions: this.#original,
      pageName: this.pageName,
      pageObject: this.pageObject,
      queue: this.getQueue(),
      snapshot: this.getSnapshot(),
      status: this.status,
    } as ReturnType<T.IActionChain['getDefaultCallbackArgs']>
  }

  /** Returns the current queue */
  getQueue() {
    return [...this.#queue]
  }

  /** Returns a snapshot of the current state in the action chain process */
  getSnapshot(): T.ActionChainSnapshot<ActionObjects> {
    return {
      currentAction: (this.#current as T.IAction) || null,
      originalActions: this.#original,
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

  /**
   * Creates an asynchronous generator that generates the next immediate action
   * when the previous has ended
   */
  async *createGenerator() {
    return async function* getExecutor() {
      let action: T.IAction | undefined
      let results: { action: T.IAction | undefined; result: any }[] = []

      while (this.#queue.length) {
        action = this.#queue.shift()
        results.push({
          action: action,
          result: await (yield { action, results }),
        })
      }

      return results
    }
  }

  createExecutor() {}

  async execute(event?: any) {
    let timeoutRef: NodeJS.Timeout

    const _executeAction = async (
      action: T.IAction,
      handlerOptions: T.ActionChainActionCallbackOptions,
    ) => {
      try {
        if (timeoutRef) clearTimeout(timeoutRef)

        timeoutRef = setTimeout(() => {
          const msg = `Action of type "${action.type}" timed out`
          action.abort(msg)
          this.abort(msg)
            .then(() => {
              throw new AbortExecuteError(msg)
            })
            .catch((err) => {
              throw err
            })
        }, 10000)

        return action.execute(handlerOptions)
      } catch (error) {
        throw error
      } finally {
        clearTimeout(timeoutRef)
      }
    }

    try {
      this.#setStatus('in.progress')

      log.func('execute')
      log.grey('Action chain started', {
        event,
        ...this.getDefaultCallbackArgs(),
      })

      if (queue.length) {
        const gen = this.createGenerator()

        let action: IAction | undefined
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
          | undefined = await this.#next(gen)

        while (!iterator?.done) {
          action = iterator?.value?.action
          log.gold('Next action', action)

          // Skip to the next loop
          if (!action) {
            iterator = await this.#next(gen)
          }
          // Goto action (will replace the soon-to-be-deprecated actionType: pageJump action)
          else {
            result = await _executeAction(action, {
              event,
              ...this.getDefaultCallbackArgs(),
            })
            log.gold(`${action.actionType} action return value: `, result)
            // log.grey('Current results from action chain', result)
            if (_.isPlainObject(result)) {
              iterator = await this.#next(gen, result)
            } else if (_.isString(result)) {
              // TODO
            } else if (_.isFunction(result)) {
              // TODO
            } else {
              iterator = await this.#next(gen, result)
            }

            if (result?.value?.result) {
              if (action.type) log.func(action.type)
              log.green(
                `Received a returned value from a(n) "${action.type}" executor`,
                result,
              )
            }
          }
        }
        // this.onChainEnd?.(
        //   this.actions as IAction[],
        //   this.getCallbackOptions({ event, ...buildOptions }),
        // )
        log.gold('Action chain reached the end of execution')
        return iterator
      } else {
        // log
        log.red('Cannot start action chain without actions in the queue', {
          ...this.getDefaultCallbackArgs(),
          event,
        })
      }
    } catch (error) {
      // this.onChainError?.(
      //   err,
      //   this.#current,
      //   this.getCallbackOptions({ event, error: err, ...buildOptions }),
      // )
      // TODO more handling
      await this.abort(
        `The value of "actions" given to this action chain was null or undefined`,
      )
      throw new Error(error)
    }
  }

  #next = async (
    gen:
      | AsyncGenerator<
          | IteratorYieldResult<{
              action: T.IAction
              results: any[]
            }>
          | IteratorReturnResult<{
              action: T.IAction
              results: any[]
            }>
        >
      | undefined,
    args?: any,
  ) => {
    const result = (await gen?.next(args)) as
      | IteratorYieldResult<{
          action: T.IAction
          results: any[]
        }>
      | undefined
    this.#current = result?.value?.action
    return result
  }

  #setStatus = (status: T.IActionChain['status']) => {
    this.status = status
    return this
  }
}

export default ActionChain
