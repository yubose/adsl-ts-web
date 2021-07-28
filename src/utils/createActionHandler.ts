import * as u from '@jsmanifest/utils'
import Logger from 'logsnap'
import { isAction } from 'noodl-action-chain'
import { Identify } from 'noodl-types'
import {
  ConsumerOptions,
  createAction,
  NUIActionGroupedType,
  NUIAction,
  NUIActionObject,
  Store,
} from 'noodl-ui'

const log = Logger.create('createActionHandler.ts')

export type ActionKind = 'action' | 'builtIn'

export type ActionHandlerArgs =
  | [destination: string]
  | [actionObject: NUIActionObject]
  | Parameters<Store.ActionObject['fn']>
  | Parameters<Store.BuiltInObject['fn']>

export interface MiddlewareObject {
  id: string
  fn: MiddlewareFn | null
}

export interface MiddlewareFn<
  O extends Record<string, any> = Record<string, any>,
> {
  (args: ActionHandlerArgs, options?: O): ActionHandlerArgs
}

let _middlewares = [] as MiddlewareObject[]
let _runMiddleware = async (
  args: ActionHandlerArgs,
  options: Record<string, any> = {},
) => Promise.all(_middlewares.map(async (mo) => mo.fn?.(args, options)))

export type StoreActionObject<
  T extends Exclude<NUIActionGroupedType, 'anonymous'> | 'builtIn' | 'emit',
> = T extends 'builtIn' ? Store.BuiltInObject : Store.ActionObject<T>

/**
 * @returns { Store.ActionObject['fn'] | Store.BuiltInObject['fn'] }
 */
function createActionHandler(
  kind?: 'action' | Store.ActionObject['fn'],
): Store.ActionObject['fn']

function createActionHandler(
  kind: 'builtIn' | Store.BuiltInObject['fn'] | never,
  fn?: Store.BuiltInObject['fn'],
): Store.BuiltInObject['fn']

function createActionHandler<K extends ActionKind>(
  kind?: K,
  fn?: Store.BuiltInObject['fn'],
) {
  let _kind = kind as ActionKind
  let _fn = fn as Store.ActionObject['fn'] | Store.BuiltInObject['fn']

  if (u.isStr(_kind)) {
    if (_kind === 'builtIn') {
      if (!u.isFnc(_fn)) {
        throw new Error(`The passed in builtIn handler is not a function`)
      }
    } else {
      if (!u.isFnc(fn)) {
        throw new Error(`The passed in fn is not a function for an ${kind}`)
      }
    }
  } else if (u.isFnc(kind)) {
    // kind is 'action'
    _kind = 'action'
    _fn = kind
  }

  if (!u.isFnc(_fn)) {
    throw new Error(`Missing function handler for a "${kind}" action`)
  }

  return async function handleAction(
    action: K extends 'action'
      ? Store.ActionObject['fn']
      : K extends 'builtIn'
      ? Store.BuiltInObject['fn']
      :
          | Store.ActionObject['fn']
          | Store.BuiltInObject['fn']
          | NUIActionObject
          | string,
    options?: ConsumerOptions,
    ...rest: any[]
  ) {
    try {
      const args = [action, options, ...rest]
      await _runMiddleware(args)

      let _action: NUIAction | undefined

      if (u.isStr(action)) {
        // Goto action (page navigation)
        const destination = action
        // TODO - Put "anonymous"
        _action = createAction({
          action: { goto: destination },
          trigger: 'onClick',
        })
      } else if (isAction(action)) {
        _action = action
        if (!options) {
          //
        }
      } else if (u.isObj(action)) {
        if (Identify.action.any(action)) {
          _action = createAction({ action, trigger: 'onClick' })
        } else if (Identify.folds.emit(action)) {
          _action = createAction({ action, trigger: 'onClick' })
        } else if (Identify.goto(action)) {
          _action = createAction({ action, trigger: 'onClick' })
        } else {
          //
        }
      }

      return _fn?.(_action, options)
    } catch (error) {
      throw error
    }
  }
}

export function createMiddleware<
  O extends Record<string, any> = Record<string, any>,
>(id: string, fn: MiddlewareFn<O>): void

export function createMiddleware<
  O extends Record<string, any> = Record<string, any>,
>(fn: MiddlewareFn<O>): void

export function createMiddleware<
  O extends Record<string, any> = Record<string, any>,
>(id: string | MiddlewareFn<O>, fn?: MiddlewareFn<O>) {
  _middlewares.push({
    id: u.isStr(id) ? id : '',
    fn: u.isFnc(id) ? id : u.isFnc(fn) ? fn : null,
  })
}

/**
 * A middleware to transform incoming args that do not fit the expected structure
 * For example all action handlers are given the action instance and the consumer options
 * in the arguments. If a function is called with just a string, this middle will transform
 * the args to the expected types by the time they are handled
 */
async function handleAbnormalArgs() {}

/**
 * Handles dynamically injected objects returned from evalObject, such as
 * when handling goto actions when demanded from user interactions
 */

export default createActionHandler
