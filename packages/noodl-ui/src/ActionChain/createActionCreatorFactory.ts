import { createEmitDataKey } from 'noodl-utils'
import { actionTypes } from '../constants'
import isPlainObject from 'lodash/isPlainObject'
import {
  ActionObject,
  ActionChainActionCallback,
  ActionConsumerCallbackOptions,
  ActionType,
  AnonymousObject,
  BuiltInObject,
  EmitActionObject,
  EmitObject,
  StoreActionObject,
} from '../types'
import ActionChain from '.'
import Action from '../Action'
import EmitAction from '../Action/EmitAction'
import { findListDataObject, isActionChainEmitTrigger } from '../utils/noodl'

const createActionCreatorFactory = function (
  ref: ActionChain,
  consumerArgs: ActionConsumerCallbackOptions,
) {
  const { component } = consumerArgs
  /** A helper to return a list of data query objects, intended for findDataValue */
  const getQueryObjects = () => [
    findListDataObject(component),
    () => consumerArgs.getPageObject(consumerArgs.page as string),
    () => consumerArgs.getRoot(),
  ]

  /**
   * Runs through the generator, yielding for callback functions in each loop
   * @param { Action } action - Action instance
   * @param { function[] } callbacks
   * @param { Event } event
   */
  async function* run(
    action: Action<any>,
    callbacks: ActionChainActionCallback<Action<any>>[],
    event: any,
  ) {
    let numCallbacks = callbacks.length
    let results = []
    let result
    for (let index = 0; index < numCallbacks; index++) {
      const fn = yield
      result = await fn?.(
        action,
        {
          ...consumerArgs,
          event,
          queue: ref.getQueue(),
          ref,
          snapshot: ref.getSnapshot(),
          status: ref.status,
        },
        ref.actionsContext,
      )
      if (result) {
        // TODO - Do a better way to identify the action
        if ((result || ({} as any)).actionType) {
          // We may get an action object returned back like from
          // evalObject. If this is the case we need to immediately
          // run this action next before continuing
          ref.insertIntermediaryAction(result)
        }
        if (Array.isArray(result)) {
          result.forEach((res) => {
            results.push(res)
            if (isPlainObject(res)) {
              if ('toast' in res) {
                console.log(
                  `%cTOAST OBJECT`,
                  `color:#00D8C2;font-weight:bold;`,
                  { action, ref, toast: res },
                )
                ref.insertIntermediaryAction({ ...res, actionType: 'toast' })
              } else if ('emit' in res) {
                //
              } else if ('actionType' in res) {
                //
              }
            }
          })
        } else {
          results.push(result)
        }
      }
    }
    return results.length > 1 ? results : results[0]
  }

  /**
   * Runs through the generator, injecting a callback in each loop.
   * Results are accumulated in each iteration and returned when the
   * generator is done
   * @param { Action } action - Action instance
   * @param { function[] } callbacks
   * @param { Event } event
   */
  const getResults = async <A extends Action<ActionObject>>(
    action: A,
    callbacks: ActionChainActionCallback[],
    event: any,
  ) => {
    const results = []

    const gen = run(action, callbacks, event)
    await gen?.next()

    let callback = callbacks?.shift()

    // TODO - unit test this (this.isAborted solves a closure bug)
    while (typeof callback === 'function' && !ref.isAborted()) {
      results.push((await gen?.next(callback))?.value)
      callback = callbacks.shift()
    }
    return results
  }

  const create = {
    ...actionTypes
      .filter((t) => !/(anonymous|builtIn|emit)/i.test(t))
      .reduce((acc, actionType) => {
        if (/(anonymous|builtIn|emit)/i.test(actionType)) return acc
        acc[actionType] = (obj: ActionObject) => {
          const action = new Action(obj, { trigger: ref.trigger })
          action.callback = async (inst: Action<ActionObject>, event: any) =>
            getResults(
              action,
              (ref.fns.action[action.actionType] || []).map(
                (a: StoreActionObject<any>) => a.fn,
              ),
              event,
            )
          return action
        }
        return acc
      }, {}),
    anonymous(obj: AnonymousObject) {
      const action = new Action(obj, { trigger: ref.trigger })
      action.callback = async (inst, event: any) =>
        action.original &&
        'fn' in action.original &&
        getResults(
          action,
          [action.original.fn] as ActionChainActionCallback<
            Action<AnonymousObject>
          >[],
          event,
        )
      return action
    },
    builtIn(obj: BuiltInObject) {
      const action = new Action(obj, { trigger: ref.trigger })
      action.callback = async (inst, event: any) =>
        getResults(
          action,
          ref.fns.builtIn[action?.original?.funcName]?.slice() || [],
          event,
        )
      return action
    },
    emit(obj: EmitObject) {
      const iteratorVar = component.get('iteratorVar') || ''
      const actionObj = { ...obj, actionType: 'emit' } as EmitActionObject
      const action = new EmitAction(actionObj, {
        dataKey: actionObj.emit?.dataKey
          ? iteratorVar && actionObj.emit?.dataKey === iteratorVar
            ? findListDataObject(component)
            : createEmitDataKey(actionObj.emit.dataKey, getQueryObjects(), {
                iteratorVar,
              })
          : undefined,
        iteratorVar,
        trigger: ref.trigger,
      })
      action.callback = async (inst, event: any) => {
        const callbacks = (ref.fns.action.emit?.slice() || []).reduce(
          (acc, a) => {
            if (
              (a.actionType === 'emit' &&
                !isActionChainEmitTrigger(a.trigger)) ||
              ref.trigger !== a.trigger
            ) {
              return acc
            }
            return acc.concat(a.fn)
          },
          [] as StoreActionObject<any>['fn'][],
        )
        return getResults(action as any, callbacks, event)
      }
      return action
    },
  }

  return create as typeof create &
    Record<
      Exclude<ActionType, 'anonymous' | 'builtIn' | 'emit'>,
      <A extends ActionObject = any>(obj: A) => Action<A>
    >
}

export default createActionCreatorFactory
