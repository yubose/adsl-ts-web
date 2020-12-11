import _ from 'lodash'
import { isDraft, original } from 'immer'
import {
  createEmitDataKey,
  findListDataObject,
  getActionType,
  isEmitObj,
} from 'noodl-utils'
import Logger from 'logsnap'
import Action from '../Action'
import EmitAction from '../Action/EmitAction'
import isReference from '../utils/isReference'
import { AbortExecuteError } from '../errors'
import { isActionChainEmitTrigger } from '../utils/noodl'
import { actionTypes } from '../constants'
import * as T from '../types'

const log = Logger.create('ActionChain')

class ActionChain<
  ActionObjects extends T.ActionObject[] = T.ActionObject[],
  C extends T.IComponent = any
> {
  #consumerArgs: T.ActionConsumerCallbackOptions & {
    trigger: T.ActionChainEmitTrigger
  }
  #original: T.ActionObject[]
  #queue: Action[] = []
  #timeoutRef: NodeJS.Timeout
  actions: ActionObjects
  actionsContext: T.ActionChainContext
  component: T.IComponent
  current: Action
  fns = { action: {}, builtIn: {} } as {
    action: Record<T.ActionType, T.ActionChainActionCallback[]>
    builtIn: { [funcName: string]: T.ActionChainActionCallback[] }
  }
  gen: AsyncGenerator<
    {
      action: ActionObjects[number] | undefined
      results: T.ActionChainGeneratorResult[]
    },
    T.ActionChainGeneratorResult[],
    any
  >
  intermediary: Action[] = []
  status: 'idle' | 'aborted' | 'in.progress' | null = null
  trigger: T.ActionChainEmitTrigger

  constructor(
    actions: T.ActionChainConstructorArgs<C>[0],
    options: T.ActionConsumerCallbackOptions & {
      trigger: T.ActionChainEmitTrigger
    },
    actionsContext: T.ActionChainContext,
  ) {
    // @ts-expect-error
    this.#original = isDraft(actions) ? original(actions) : actions
    this.#original = this.#original?.map((a) => {
      const obj = isDraft(a) ? original(a) : a
      const result = { actionType: getActionType(obj) }
      if (typeof obj === 'function') result.fn = obj
      else Object.assign(result, obj)
      return result
    }) as ActionObjects
    this.#consumerArgs = options
    this.actions = this.#original as ActionObjects
    this.actionsContext = actionsContext
    this.component = options.component
    this.fns.action = actionTypes.reduce(
      (acc, type) => Object.assign(acc, { [type]: [] }),
      {} as ActionChain['fns']['action'],
    )
    this.trigger = options.trigger
  }

  /**
   * Aborts the action chain from further running
   * @param { string | string[] | undefined } reason
   */
  async abort(reason?: string | string[]) {
    const reasons = reason
      ? _.isArray(reason)
        ? reason
        : [reason]
      : ([] as string[])

    this.#setStatus({
      aborted: reasons.length ? { reasons } : true,
    } as any)

    log.func('abort')
    log.orange('Aborting...', { reasons, status: this.status })

    // Exhaust the remaining actions in the queue and abort them
    while (this.#queue.length) {
      const action = this.#queue.shift()
      if (action?.status !== 'aborted') {
        log.grey(`Aborting action ${action?.type}`, action)
        try {
          action?.abort(reason || '')
          log.grey(
            `Aborted action of type ${action?.type || '<Missing action type>'}`,
            action,
          )
        } catch (error) {
          throw new AbortExecuteError(error.message)
        }
      }
    }

    log.grey(`Abort finished`, {
      actionChain: this,
      snapshot: this.getSnapshot(),
    })
    // This will return an object like { value, done: true }
    return this.gen?.return?.(reasons.join(', '))
  }

  build() {
    this.loadQueue()
    this.loadGen()

    const actionChainHandler = async (event?: any) => {
      try {
        this.#setStatus('in.progress')
        log.func('execute')
        log.grey('Action chain started', this.getDefaultCallbackArgs({ event }))

        if (this.#queue.length) {
          let action: Action | undefined
          let result: any
          let iterator = await this.next()

          while (iterator && !iterator?.done) {
            action = iterator.value?.action as Action

            // Skip to the next loop
            if (!action) {
              iterator = await this.next()
            }
            // Goto action (will replace the soon-to-be-deprecated actionType: pageJump action)
            else {
              result = await this.execute.call(
                this,
                action,
                this.getDefaultCallbackArgs({ event }),
              )
              // log.grey('Current results from action chain', result)
              if (_.isPlainObject(result)) {
                iterator = await this.next(result)
              } else if (_.isString(result)) {
                // TODO
              } else if (_.isFunction(result)) {
                // TODO
              } else {
                iterator = await this.next(result)
              }

              if (result) {
                if (action.type) log.func(action.type)
                log.grey(
                  `Received a returned value from a(n) "${action.type}" executor`,
                  result,
                )
              }
            }
          }
          log.grey('Action chain reached the end of execution', this)
          return this.build
        } else {
          log.red(
            'Cannot start action chain without actions in the queue',
            this.getDefaultCallbackArgs({
              ref: this,
              event,
            }),
          )
        }
      } catch (error) {
        await this.abort(error.message)
        throw new AbortExecuteError(error.message)
      } finally {
        this.refresh()
      }
    }

    return actionChainHandler.bind(this)
  }

  #setStatus = (status: ActionChain<any, any>['status']) => {
    this.status = status
  }

  /**
   * Creates and returns a new Action instance
   * @param { object } obj - Action object
   * NOTE: obj should have an "actionType" by the time of this call
   */
  createAction<A extends T.ActionObject>(obj: A) {
    async function* runActionFuncs({
      ref,
      callbacks,
      instance,
      options,
    }: {
      ref: ActionChain<any, any>
      callbacks: T.ActionChainActionCallback<ActionObjects>[]
      instance: ActionObjects[number]
      options: Parameters<T.ActionChainActionCallback<ActionObjects>>
    }) {
      let numFuncs = callbacks.length
      let results = []
      let result
      for (let index = 0; index < numFuncs; index++) {
        const fn = yield
        result = await fn?.(instance, options, ref.actionsContext)
        results.push(result)
        // TODO - Do a better way to identify the action
        if ((result || ({} as A)).actionType) {
          // We may get an action object returned back like from
          // evalObject. If this is the case we need to immediately
          // run this action before continuing
          // Start up a new Action with this object and inject it
          // as the first item in the queued actions
          const intermediaryAction = ref.createAction(result)
          if (intermediaryAction) {
            ref.intermediary.push(intermediaryAction)
            ref.#queue = [intermediaryAction, ...ref.#queue]
          }
        }
      }
      return results.length > 1 ? results : results[0]
    }

    let action: any
    let conditionalCallbackArgs = {} as any
    let callbacks: any[]

    const attachFn = (_action: Action | EmitAction) => {
      _action.trigger = this.trigger
      _action.callback = async (
        instance: Parameters<
          T.ActionChainActionCallback<ActionObjects[number]>
        >[0],
        options: Parameters<
          T.ActionChainActionCallback<ActionObjects[number]>
        >[1],
      ) => {
        let gen
        const callbackArgs = {
          ...options,
          ...conditionalCallbackArgs,
          component: this.component,
          ref: this,
        }
        const logArgs = {
          action: _action,
          actions: callbackArgs.ref.actions,
          callbackArgs,
          component: callbackArgs.component,
          originalActionObj: obj,
          instance: _action,
          queue: callbackArgs.ref.#queue.slice(),
          ref: callbackArgs.ref,
        }
        log.func('attachFn')
        if (action.actionType === 'anonymous') {
          log.grey('Loading anonymous action', logArgs)
          if ('fn' in _action.original) {
            callbacks = [_action.original.fn]
            gen = runActionFuncs({
              ref: callbackArgs.ref,
              callbacks,
              instance: _action,
              options: callbackArgs,
            })
          }
        } else if (_action.original.actionType === 'builtIn') {
          log.grey('Loading builtIn action', logArgs)
          callbacks =
            callbackArgs.ref.fns.builtIn[_action?.original?.funcName] || []
          if (!callbacks) return
          gen = runActionFuncs({
            ref: callbackArgs.ref,
            callbacks,
            instance,
            options: callbackArgs,
          })
        } else {
          callbacks = _.reduce(
            this.fns.action[action.actionType] ||
              ([] as T.ActionChainUseObjectBase<ActionObjects[number], any>[]),
            (
              acc,
              a: T.ActionChainUseObjectBase<ActionObjects[number], any>,
            ) => {
              const isUnrelatedTrigger =
                action.actionType === 'emit' &&
                !isActionChainEmitTrigger(callbackArgs.ref.trigger)
              if (isUnrelatedTrigger) {
                log.grey(
                  `Discarding unrelated action "${action.actionType}" from the action callback`,
                  { callbacks, ...logArgs },
                )
                return acc
              }
              // Only attach the action handlers that these object expect
              // ex: Don't attach onChange emit handlers to onClick emits
              if (
                a.actionType === 'emit' &&
                callbackArgs.ref.trigger !== a.trigger
              ) {
                return acc
              }
              return acc.concat(a.fn)
            },
            [] as T.ActionChainUseObjectBase<
              ActionObjects[number],
              any
            >['fn'][],
          )
          log.green('You reached the end of action[callback]', {
            _action,
            callbacks,
          })

          if (!gen) {
            gen = runActionFuncs({
              ref: callbackArgs.ref,
              callbacks,
              instance,
              options: callbackArgs,
            })
          }
        }

        const consumerResult = await gen?.next()
        log.gold('consumerResult', consumerResult)

        const results = []
        const fns = callbacks.slice()
        let callback = fns.shift()

        // TODO - unit test this (this.isAborted solves a closure bug)
        while (typeof callback === 'function' && !this.isAborted()) {
          results.push((await gen?.next(callback))?.value)
          callback = fns.shift()
        }

        return results
      }
    }

    if (typeof obj === 'object') {
      if (isEmitObj(obj)) {
        const emitObj = obj as T.EmitObject
        const emitAction = new EmitAction(emitObj, {
          iteratorVar: this.component.get('iteratorVar') || '',
          trigger: this.trigger,
        })
        if (emitObj.emit?.dataKey) {
          emitAction.setDataKey(
            emitAction.iteratorVar &&
              emitObj.emit?.dataKey === emitAction.iteratorVar
              ? findListDataObject(this.component)
              : createEmitDataKey(
                  emitObj.emit.dataKey,
                  [
                    findListDataObject(this.component),
                    () =>
                      this.#consumerArgs.getPageObject(this.#consumerArgs.page),
                    () => this.#consumerArgs.getRoot(),
                  ],
                  { iteratorVar: emitAction.iteratorVar },
                ),
          )
        }

        attachFn((action = emitAction))
      } else {
        attachFn((action = new Action(obj, { trigger: this.trigger })))
      }
    } else {
      log.func('createAction')
      log.red(
        `Expected an action object but received type ${typeof obj} instead`,
        {
          action,
          actions: this.actions,
          original: obj,
          queue: this.getQueue(),
          ref: this,
        },
      )
    }

    return action
  }

  /**
   * Runs the next async generator call
   * @param { any } args - Args for the next async call
   */
  async next(args?: any) {
    const result = await this.gen.next(args)
    if (result.value && result.value instanceof Action) {
      this.current = result.value
    }
    return result
  }

  refresh() {
    if (this.#timeoutRef) clearTimeout(this.#timeoutRef)
    this.#queue = []
    this.status = null
    // this['gen'] = undefined
    this.loadQueue()
    this.loadGen()
    log.func('build')
    log.grey(`Refreshed action chain`, {
      actions: this.actions,
      actionChain: this,
      queue: this.getQueue(),
    })
  }

  /**
   * Creates an asynchronous generator that generates the next immediate action
   * when the previous has ended
   */
  async *createGenerator() {
    let action: T.IAction | undefined
    let results: T.ActionChainGeneratorResult[] = []

    while (this.#queue.length) {
      action = this.#queue.shift()
      results.push({
        action: action,
        result: await (yield { action, results }),
      })
    }

    return results
  }

  loadGen() {
    this['gen'] = this.createGenerator()
    return this
  }

  async execute(
    action: T.IAction,
    handlerOptions: T.ActionConsumerCallbackOptions,
  ) {
    let result
    try {
      if (this.#timeoutRef) clearTimeout(this.#timeoutRef)
      this.#timeoutRef = setTimeout(() => {
        const msg = `Action of type "${action.type}" timed out`
        action.abort(msg)
        this.abort(msg)
          .then(() => {
            throw new AbortExecuteError(msg)
          })
          .catch((err) => {
            throw new AbortExecuteError(err)
          })
      }, 10000)
      result = await action.execute(handlerOptions)
      if (_.isPlainObject(result)) {
        if ('wait' in result)
          await this.abort(
            `An action returned from a "${action.actionType}" type requested to wait`,
          )
      }
      return result
    } catch (error) {
      throw error
    } finally {
      clearTimeout(this.#timeoutRef)
    }
  }

  /**
   * Returns options that will be passed into each action callback in the action chain
   * The current snapshot is also included in the result
   * @param { object } args
   */
  getDefaultCallbackArgs(otherArgs?: any) {
    return {
      ...this.#consumerArgs,
      ...otherArgs,
      abort: this.abort.bind(this),
      actions: this.actions,
      queue: this.getQueue(),
      status: this.status,
    }
  }

  /** Returns the current queue */
  getQueue() {
    return this.#queue.slice()
  }

  /**
   * Load up the queue and the actions list
   * The actions in the queue are identical to the ones in this.actions
   * The only difference is that the actions will be removed from the queue
   * as soon as they are done executing
   */
  loadQueue() {
    _.forEach(this.actions, (actionObj: T.ActionObject | Function | string) => {
      let action: T.IAction<ActionObjects[number]> | undefined

      if (_.isFunction(actionObj)) {
        if (!this.fns.action.anonymous?.length) {
          log.func('loadQueue')
          log.red(
            `Encountered an action object that is not an object type. You will` +
              `need to register an "anonymous" action as an actionType if you want to ` +
              `handle anonymous functions`,
            { received: actionObj, component: this?.component },
          )
        }
        action = this.createAction({ actionType: 'anonymous', fn: actionObj })
      }
      // Temporarily hardcode the actionType to blend in with the other actions
      // for now until we find a better solution
      else {
        if (isReference(actionObj as string)) {
          log.func('loadQueue')
          log.red(`Received a reference string but expected an action object`, {
            actions: this.actions,
            actionObj,
            actionChain: this,
          })
        } else if (typeof actionObj === 'object') {
          if ('emit' in actionObj) {
            actionObj = {
              ...actionObj,
              actionType: 'emit',
            } as T.EmitActionObject
          } else if ('goto' in actionObj) {
            actionObj = {
              ...actionObj,
              actionType: 'goto',
            } as T.GotoObject
          }
          action = this.createAction(actionObj as T.ActionObject)
        }
      }

      if (action) {
        this.#queue.push(action)
      } else {
        log.grey(
          `Could not convert action ${
            typeof actionObj === 'object'
              ? actionObj.actionType
              : String(actionObj)
          } to an instance`,
          {
            action,
            actionChain: this,
            actions: this.actions,
            component: this.component,
            original: actionObj,
          },
        )
      }
    })
    return this
  }

  /** Returns a snapshot of the current state in the action chain process */
  getSnapshot(): T.ActionChainSnapshot {
    return {
      currentAction: this.current,
      original: this.#original,
      queue: this.getQueue(),
      status: this.status,
    }
  }

  insertIntermediaryAction(actionObj: T.ActionObject) {
    const action = this.createAction(actionObj)
    this.#queue.unshift(action)
    return action
  }

  isAborted() {
    return !!(
      this.status === 'aborted' ||
      (this.status &&
        typeof this.status === 'object' &&
        'aborted' in this.status)
    )
  }

  useAction(action: T.ActionChainUseObject): this
  useAction(action: T.ActionChainUseObject[]): this
  useAction(action: T.ActionChainUseObject | T.ActionChainUseObject[]) {
    // Built in actions are forwarded to this.useBuiltIn
    _.forEach(_.isArray(action) ? action : [action], (obj) => {
      if ('funcName' in obj) {
        this.useBuiltIn(obj)
      } else {
        this.fns.action[obj.actionType] = [
          ...(this.fns.action[obj.actionType] || []),
          ...(_.isArray(obj) ? obj : ([obj] as any)),
        ]
      }
    })
    return this
  }

  useBuiltIn(
    action: T.ActionChainUseBuiltInObject | T.ActionChainUseBuiltInObject[],
  ) {
    const actions = (_.isArray(action)
      ? action
      : [action]) as T.ActionChainUseBuiltInObject[]

    _.forEach(actions, (a) => {
      const { funcName } = a
      const currentFns = this.fns.builtIn[funcName] || []
      this.fns.builtIn[funcName] = currentFns.concat(
        _.isArray(a.fn) ? a.fn : [a.fn],
      )
    })

    return this
  }
}

export default ActionChain
