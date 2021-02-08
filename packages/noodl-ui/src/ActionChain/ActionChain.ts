import { isDraft, original } from 'immer'
import { getActionType } from 'noodl-utils'
import isPlainObject from 'lodash/isPlainObject'
import Logger from 'logsnap'
import Action from '../Action'
import EmitAction from '../Action/EmitAction'
import createActionCreatorFactory from './createActionCreatorFactory'
import { AbortExecuteError } from '../errors'
import { actionTypes } from '../constants'
import * as T from '../types'
import {
  AnonymousObject,
  EmitActionObject,
  GotoActionObject,
  ToastActionObject,
} from '../types'

const log = Logger.create('ActionChain')

class ActionChain<ActionObjects extends T.ActionObject[] = T.ActionObject[]> {
  #consumerArgs: T.ActionConsumerCallbackOptions & {
    trigger: T.ActionChainEmitTrigger
  }
  #original: T.ActionObject[]
  #queue: Action<ActionObjects[number]>[] = []
  #timeoutRef: NodeJS.Timeout
  actions: ActionObjects
  actionsContext: T.ActionChainContext
  component: T.ComponentInstance
  createAction: ReturnType<typeof createActionCreatorFactory>
  current: Action<
    | T.ActionObject
    | AnonymousObject
    | EmitActionObject
    | GotoActionObject
    | ToastActionObject
  >
  fns = { action: {}, builtIn: {} } as {
    action: Record<
      T.ActionType | 'anonymous' | 'emit' | 'goto' | 'toast',
      T.StoreActionObject<any>[]
    >
    builtIn: { [funcName: string]: T.StoreBuiltInObject<any>[] }
  }
  gen: AsyncGenerator<
    {
      action: ActionObjects[number] | undefined
      results: T.ActionChainGeneratorResult[]
    },
    T.ActionChainGeneratorResult[],
    any
  >
  intermediary: Action<ActionObjects[number]>[] = []
  status: 'idle' | 'aborted' | 'in.progress' | null = null
  trigger: T.ActionChainEmitTrigger

  constructor(
    actions: T.ActionChainConstructorArgs<any>[0],
    options: T.ActionConsumerCallbackOptions & {
      trigger: T.ActionChainEmitTrigger
    },
    actionsContext: T.ActionChainContext,
  ) {
    // @ts-expect-error
    this.#original = isDraft(actions) ? original(actions) : actions
    this.#original = this.#original?.map((a) => {
      const obj = isDraft(a) ? original(a) : a
      const result = { actionType: getActionType(obj) } as any
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
    if (options?.trigger) this.trigger = options.trigger
    this.createAction = createActionCreatorFactory(this, options)
  }

  /**
   * Aborts the action chain from further running
   * @param { string | string[] | undefined } reason
   */
  async abort(reason?: string | string[]) {
    const reasons = reason
      ? Array.isArray(reason)
        ? reason
        : [reason]
      : ([] as string[])

    this.status = {
      aborted: reasons.length ? { reasons } : true,
    } as any

    log.func('abort')
    log.orange('Aborting...', { reasons, status: this.status })

    // Exhaust the remaining actions in the queue and abort them
    while (this.#queue.length) {
      const action = this.#queue.shift()
      if (action?.status !== 'aborted') {
        log.grey(`Aborting action ${action?.actionType}`, action)
        try {
          action?.abort(reason || '')
        } catch (error) {
          throw new AbortExecuteError(error.message)
        }
      }
    }
    // This will return an object like { value, done: true }
    return this.gen?.return?.(reasons.join(', ') as any)
  }

  build() {
    this.loadQueue()
    this.loadGen()

    const actionChainHandler = async (event?: any) => {
      try {
        this.status = 'in.progress'
        log.func('actionChainHandler')
        log.grey('Action chain started', {
          ...this.getDefaultCallbackArgs({ event }),
          fns: this.fns,
        })

        if (this.#queue.length) {
          let action: Action<ActionObjects[number]> | undefined
          let result: any
          let iterator = await this.next()

          while (iterator && !iterator?.done) {
            action = iterator.value?.action as Action<ActionObjects[number]>

            // Skip to the next loop
            if (!action) {
              iterator = await this.next()
            }
            // Goto action (will replace the soon-to-be-deprecated actionType: pageJump action)
            else {
              result = await this.execute(
                action,
                this.getDefaultCallbackArgs({ event }),
              )
              // log.grey('Current results from action chain', result)
              if (isPlainObject(result)) {
                iterator = await this.next(result)
              } else if (typeof result === 'string') {
                // TODO
              } else if (typeof result === 'function') {
                // TODO
              } else {
                iterator = await this.next(result)
              }
            }
          }
          log.grey('Action chain reached the end of execution', this)
          return actionChainHandler.bind(this)
        } else {
          log.red(
            'Cannot start action chain without actions in the queue',
            this.getDefaultCallbackArgs({
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
    this.loadQueue()
    this.loadGen()
    log.func('build')
    log.grey(`Refreshed action chain`, {
      actions: this.actions?.slice?.() || [],
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
    this.gen = this.createGenerator()
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
        const msg = `Action of type "${action.actionType}" timed out`
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
      if (isPlainObject(result)) {
        if ('wait' in (result || {}))
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
      snapshot: this.getSnapshot(),
      status: this.status,
    }
  }

  /** Returns the current queue */
  getQueue() {
    return this.#queue?.slice?.()
  }

  /**
   * Load up the queue and the actions list
   * The actions in the queue are identical to the ones in this.actions
   * The only difference is that the actions will be removed from the queue
   * as soon as they are done executing
   */
  loadQueue() {
    this.actions.forEach((actionObj: T.ActionObject | Function | string) => {
      let action:
        | Action<T.ActionObject>
        | EmitAction<T.EmitActionObject>
        | undefined

      if (typeof actionObj === 'function') {
        action = this.createAction.anonymous({
          actionType: 'anonymous',
          fn: actionObj,
        })
      }
      // Temporarily hardcode the actionType to blend in with the other actions
      // for now until we find a better solution
      else {
        if (typeof actionObj === 'object') {
          if ('emit' in (actionObj || {})) {
            actionObj.actionType = 'emit'
          } else if ('goto' in (actionObj || {})) {
            ;(actionObj as T.GotoObject).actionType = 'goto'
          }
          if (typeof this.createAction[actionObj.actionType] === 'function') {
            action = this.createAction[actionObj.actionType]({
              ...actionObj,
            } as T.ActionObject)
          }
        }
      }
      if (action) this.#queue.push(action as Action<T.ActionObject>)
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
    let action:
      | Action<T.ActionObject>
      | EmitAction<T.EmitActionObject>
      | undefined
    if (typeof this.createAction[actionObj.actionType] === 'function') {
      action = this.createAction[actionObj.actionType](actionObj as any)
      this.#queue.unshift(action as Action<ActionObjects[number]>)
      this.intermediary.push(action as Action<ActionObjects[number]>)
    }
    return action as Action<T.ActionObject> | EmitAction<T.EmitActionObject>
  }

  isAborted() {
    return !!(
      this.status === 'aborted' ||
      (this.status &&
        typeof this.status === 'object' &&
        'aborted' in (typeof this.status === 'object' ? this.status || {} : {}))
    )
  }

  useAction(action: T.StoreActionObject<any>): this
  useAction(action: T.StoreActionObject<any>[]): this
  useAction(action: T.StoreActionObject<any> | T.StoreActionObject<any>[]) {
    // Built in actions are forwarded to this.useBuiltIn
    ;(Array.isArray(action) ? action : [action]).forEach((obj) => {
      if ('funcName' in (obj || {})) {
        this.useBuiltIn(obj)
      } else {
        this.fns.action[obj.actionType] = [
          ...(this.fns.action[obj.actionType] || []),
          ...(Array.isArray(obj) ? obj : ([obj] as any)),
        ]
      }
    })
    return this
  }

  useBuiltIn(action: T.StoreBuiltInObject<any> | T.StoreBuiltInObject<any>[]) {
    const actions = (Array.isArray(action)
      ? action
      : [action]) as T.StoreBuiltInObject<any>[]

    actions.forEach((a) => {
      const { funcName } = a
      const currentFns = this.fns.builtIn[funcName] || []
      this.fns.builtIn[funcName] = currentFns.concat(Array.isArray(a) ? a : [a])
    })

    return this
  }
}

export default ActionChain
