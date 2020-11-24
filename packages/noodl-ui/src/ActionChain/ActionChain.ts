import _ from 'lodash'
import { isDraft, original } from 'immer'
import {
  findDataObject,
  findListDataObject,
  getActionType,
  isListConsumer,
} from 'noodl-utils'
import Logger from 'logsnap'
import Action from '../Action'
import EmitAction from '../Action/EmitAction'
import { AbortExecuteError } from '../errors'
import { isActionChainEmitTrigger } from '../utils/noodl'
import isReference from '../utils/isReference'
import * as T from '../types'

const log = Logger.create('ActionChain')

class ActionChain<
  ActionObjects extends T.ActionObject[],
  C extends T.IComponentTypeInstance
> implements T.IActionChain<ActionObjects, C> {
  #current: T.IAction | undefined
  #original: T.ActionObject[]
  #queue: T.IAction[] = []
  #timeoutRef: NodeJS.Timeout
  actions: T.ActionObject[] = []
  actionsContext: T.IActionChainContext
  component: C
  current: {
    action: T.IAction | undefined
    index: number
  }
  fns: T.IActionChain['fns'] = { action: {}, builtIn: {} }
  gen: T.IActionChain['gen']
  pageName?: string
  pageObject?: T.PageObject | null
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
      actionsContext,
      component,
      pageName,
      pageObject,
      trigger,
    }: T.IActionChainConstructorArgs<ActionObjects, C>[1],
  ) {
    // @ts-expect-error
    this.#original = isDraft(actions) ? original(actions) : actions
    this.#original = this.#original?.map((a) => {
      const obj = isDraft(a) ? original(a) : a
      const result = { actionType: getActionType(obj) }
      if (typeof obj === 'function') result.fn = obj
      else Object.assign(result, obj)
      return result
    }) as T.ActionObject[]
    this['actions'] = this.#original
    this['actionsContext'] = actionsContext
    this['component'] = component
    this['pageName'] = pageName
    this['pageObject'] = pageObject
    this['trigger'] = trigger
  }

  useAction(action: T.IActionChainUseObject): this
  useAction(action: T.IActionChainUseObject[]): this
  useAction(action: T.IActionChainUseObject | T.IActionChainUseObject[]) {
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
        // const fn = callbacks[index]
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
          const intermediaryAction = this.createAction(result)
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

    const attachFn = (_action: T.IAction) => {
      _action['callback'] = async (
        instance: Parameters<
          T.ActionChainActionCallback<ActionObjects[number]>
        >[0],
        options: Parameters<
          T.ActionChainActionCallback<ActionObjects[number]>
        >[1],
      ) => {
        let result, gen, iterator
        const callbackArgs = {
          ...options,
          ...conditionalCallbackArgs,
          component: this.component,
          ref: this,
        }
        const logArgs = {
          action: _action,
          component: this.component,
          callbackArgs,
          originalActionObj: obj,
          instance: _action,
          actions: this.actions,
          queue: this.#queue.slice(),
        }
        log.func('attachFn')
        log.red('attachFn', { ...callbackArgs, ...logArgs })
        if (action.actionType === 'anonymous') {
          log.grey('Loading anonymous action', logArgs)
          if ('fn' in _action.original) {
            callbacks = [_action.original.fn]
            gen = runActionFuncs({
              ref: this,
              callbacks,
              instance: _action,
              options: callbackArgs,
            })
          }
        } else if (action.actionType === 'builtIn') {
          log.grey('Loading builtIn action', logArgs)
          callbacks = this.fns.builtIn[_action?.original?.funcName] || []
          if (!callbacks) return
          gen = runActionFuncs({
            ref: this,
            callbacks,
            instance,
            options: callbackArgs,
          })
        } else {
          callbacks = _.reduce(
            this.fns.action[action.actionType] ||
              ([] as T.IActionChainUseObjectBase<ActionObjects[number]>[]),
            (acc, a: T.IActionChainUseObjectBase<ActionObjects[number]>) => {
              const isUnrelatedTrigger =
                action.actionType === 'emit' &&
                !isActionChainEmitTrigger(this.trigger)
              if (isUnrelatedTrigger) {
                log.grey(
                  `Discarding unrelated action "${action.actionType}" from the action callback`,
                  { callbacks, ...logArgs },
                )
                return acc
              }
              // Only attach the action handlers that these object expect
              // ex: Don't attach onChange emit handlers to onClick emits
              if (a.actionType === 'emit' && this.trigger !== a.trigger) {
                return acc
              }
              log.grey(`Accepting action chain trigger handler`, {
                callbacks,
                ...logArgs,
                component: this.component,
              })
              return acc.concat(a.fn)
            },
            [],
          )
          log.green('You reached the end of action[callback]', {
            _action,
            callbacks,
          })

          if (!gen) {
            gen = runActionFuncs({
              ref: this,
              callbacks,
              instance,
              options: callbackArgs,
            })
          }
        }

        await gen?.next()

        const results = []
        const fns = callbacks.slice()
        let callback = fns.shift()

        while (typeof callback === 'function') {
          results.push((await gen?.next(callback))?.value)
          callback = fns.shift()
        }

        return results
      }
    }

    if (typeof obj === 'object') {
      if (obj.actionType === 'emit' || 'emit' in obj) {
        const emitObj = obj as T.EmitActionObject
        const emitAction = new EmitAction(emitObj)
        emitAction.set('trigger', this.trigger)

        if (_.isPlainObject(emitObj.emit?.dataKey)) {
          const entries = _.entries(emitObj.emit.dataKey)
          const iteratorVar = this.component.get('iteratorVar') || ''
          const isListItemDataObject = _.some(
            _.values(emitObj?.emit?.dataKey),
            (dataKey) => `${dataKey}`.startsWith(iteratorVar),
          )
          emitAction.set('iteratorVar', iteratorVar)
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
          emitAction.set('dataKey', emitObj.emit.dataKey)
          if (isListConsumer(this.component)) {
            emitAction.set('iteratorVar', this.component.get('iteratorVar'))
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
        action = emitAction
        attachFn(emitAction)
      } else {
        action = new Action(obj)
        attachFn(action)
      }
    } else {
      log.func('createAction')
      log.red(
        `Expected an action object but received type ${typeof obj} instead`,
        {
          action,
          actions: this.actions,
          actionObj: obj,
          actionChain: this,
        },
      )
    }

    return action
  }

  build() {
    this.loadQueue()
    this.loadGen()

    return async (event?: any) => {
      try {
        this.#setStatus('in.progress')
        log.func('execute')
        log.grey('Action chain started', {
          event,
          ...this.getDefaultCallbackArgs(),
        })

        if (this.#queue.length) {
          let action: T.IAction | undefined
          let result: any
          let iterator = await this.gen?.next?.()

          while (iterator && !iterator?.done) {
            action = iterator.value?.action

            // Skip to the next loop
            if (!action) {
              iterator = await this.gen.next()
            }
            // Goto action (will replace the soon-to-be-deprecated actionType: pageJump action)
            else {
              result = await this.execute(action, {
                event,
                ...this.getDefaultCallbackArgs(),
              })
              // log.grey('Current results from action chain', result)
              if (_.isPlainObject(result)) {
                iterator = await this.gen.next(result)
              } else if (_.isString(result)) {
                // TODO
              } else if (_.isFunction(result)) {
                // TODO
              } else {
                iterator = await this.gen.next(result)
              }

              if (result) {
                if (action.type) log.func(action.type)
                log.grey(
                  `Received a returned value from a(n) "${action.type}" executor`,
                  result,
                )
              } else {
                // if (!result) {
                //   console.warn(
                //     `The action chain generated returned null or undefined. The ` +
                //       `action chain will not be executed further`,
                //     { event, ...this.getDefaultCallbackArgs() },
                //   )
                // }
              }
            }
          }
          // this.onChainEnd?.(
          //   this.actions as IAction[],
          //   this.getCallbackOptions({ event, ...buildOptions }),
          // )
          log.grey('Action chain reached the end of execution', this)
          return iterator?.value
        } else {
          // logs
          log.red('Cannot start action chain without actions in the queue', {
            ...this.getDefaultCallbackArgs(),
            actionChain: this,
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
        await this.abort(error.message)
        throw new AbortExecuteError(error)
      } finally {
        this.refresh()
      }
    }
  }

  async execute(
    action: T.IAction,
    handlerOptions: T.ActionChainActionCallbackOptions,
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
    } catch (error) {
      throw error
    } finally {
      clearTimeout(this.#timeoutRef)
    }
    return result
  }

  /**
   * Returns options that will be passed into each action callback in the action chain
   * The current snapshot is also included in the result
   * @param { object } args
   */
  getDefaultCallbackArgs() {
    return {
      actions: this.actions,
      component: this.component,
      pageName: this.pageName,
      pageObject: this.pageObject,
      queue: this.getQueue(),
      snapshot: this.getSnapshot(),
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
        log.func('loadQueue')
        this.#queue.push(action)
        log.grey(`Loaded "${action.actionType}" action into the queue`, {
          action,
          actionChain: this,
          actions: this.actions,
          component: this.component,
          original: actionObj,
        })
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

  loadGen() {
    this['gen'] = this.createGenerator()
    return this
  }

  /** Returns a snapshot of the current state in the action chain process */
  getSnapshot(): T.ActionChainSnapshot<ActionObjects> {
    return {
      originalActions: this.#original,
      queue: this.getQueue(),
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
    log.orange('Aborting...', { reasons, status: this.status })

    // if (this.getQueue().length) this.#queue.unshift(this.#current)

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
      (await this.gen?.return?.(reasons.join(', '))) || {}
    // if (this.onChainAborted) {
    // await this.onChainAborted?.(
    //   this.#current,
    //   this.getCallbackOptions({
    //     omit: 'abort',
    //     include: { abortResult },
    //   }),
    // )
    // }
    log.grey(`Abort finished`, {
      actionChain: this,
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

  refresh() {
    if (this.#timeoutRef) clearTimeout(this.#timeoutRef)
    this.#queue = []
    this.status = null
    // this['gen'] = undefined
    this.loadQueue().loadGen()
    log.func('build')
    log.grey(`Refreshed action chain`, {
      actions: this.actions,
      actionChain: this,
      queue: this.getQueue(),
    })
  }

  #setStatus = (status: T.IActionChain['status']) => {
    this.status = status
  }
}

export default ActionChain
