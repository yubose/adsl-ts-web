import _ from 'lodash'
import { isDraft, original } from 'immer'
import { findDataObject, findListDataObject, isListConsumer } from 'noodl-utils'
import Logger from 'logsnap'
import Action from '../Action'
import EmitAction from '../Action/EmitAction'
import { AbortExecuteError } from '../errors'
import { createExecute, createActionChainGenerator } from './execute'
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
  actions: T.IAction[] = []
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
  createAction<A extends ActionObjects[number]>(obj: A): T.IAction<A> {
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

    let action =
      obj.actionType === 'emit'
        ? new EmitAction(obj as T.EmitActionObject)
        : new Action(obj)
    let conditionalCallbackArgs = {} as any
    let callbacks: any[]

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
    }

    action['callback'] = async (
      instance: Parameters<
        T.ActionChainActionCallback<ActionObjects[number]>
      >[0],
      options: Parameters<
        T.ActionChainActionCallback<ActionObjects[number]>
      >[1],
    ) => {
      const callbackArgs = { ...options, ...conditionalCallbackArgs }
      if (obj.actionType === 'anonymous') {
        if ('fn' in action.original) {
          await action.original.fn?.(instance, callbackArgs)
        }
      } else if (obj.actionType === 'builtIn') {
        callbacks = this.fns.builtIn[action?.original?.funcName] || []
        if (!callbacks) return
        await runActionFuncs({ callbacks, instance, options: callbackArgs })
      } else {
        callbacks = _.reduce(
          this.fns.action[obj.actionType] || [],
          (acc, a) =>
            obj.actionType === 'emit' && !isActionChainEmitTrigger(this.trigger)
              ? acc
              : acc.concat(a.fn),
          [],
        )
        console.info('obj', obj)
        console.info('fns', this.fns)
        console.info('callbacks', callbacks)
        await runActionFuncs({ callbacks, instance, options: callbackArgs })
      }
      console.info(callbackArgs)
    }

    return action
  }

  build(buildOptions: T.IActionChainBuildOptions) {
    /**
     * Load up the queue and the actions list
     * The actions in the queue are identical to the ones in this.actions
     * The only difference is that the actions will be removed from the queue
     * as soon as they are done executing
     */
    const loadQueue = () => {
      log.func('loadQueue')
      let isRefreshed

      if (this.actions?.length) {
        isRefreshed = true
        log.func('build')
        log.grey(`Refreshing action chain`, {
          instance: this,
          originalActions: this.#original,
        })
      }

      this.actions = []

      this.#queue = _.reduce(
        this.#original,
        (acc, actionObj: T.IActionObject | Function) => {
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
            if ('emit' in actionObj) {
              actionObj = {
                ...actionObj,
                actionType: 'emit',
              } as T.EmitActionObject
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
            log.grey(`Loaded "${action.actionType}" action into the queue`, {
              action: action.getSnapshot(),
              actionInstance: action,
              actionChain: this,
              component: this.component,
              actions: this.actions,
              actionObj,
            })
            return acc.concat(action)
          }
          return acc
        },
        [] as T.IAction<ActionObjects[number]>[],
      )

      if (isRefreshed) {
        log.grey(`Refreshed action chain`, {
          instance: this,
          originalActions: this.#original,
        })
      }

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

    return (args: any) => {
      const executeActions = (a) => {
        console.info('executeActions "a" arg', a)
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
        })(a)
      }

      return executeActions(execute)(args)
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
  }): T.ActionChainCallbackOptions<ActionObjects> {
    const { omit, include, ...rest } = options || {}
    const callbackOptions = {
      abort: this.abort.bind(this),
      component: this.component,
      snapshot: this.getSnapshot(),
      ...rest,
      ...include,
    } as T.ActionChainCallbackOptions<T.IAction[]>

    if (omit) {
      return _.omit(callbackOptions, omit) as T.ActionChainCallbackOptions<
        ActionObjects
      >
    }
    return callbackOptions
  }

  /** Returns the current queue */
  getQueue() {
    return [...this.#queue]
  }

  /** Returns a snapshot of the current state in the action chain process */
  getSnapshot(): T.ActionChainSnapshot<ActionObjects[number]> {
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

  #setStatus = (status: T.IActionChain['status']) => {
    this.status = status
    return this
  }
}

export default ActionChain
