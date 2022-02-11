/**
 * TODO - Move middlewares to noodl-ui
 *
 * The actionFactory is in its experimental phase and is meant to wrap
 * actions in src/handlers/actions.ts (or src/handlers/builtIns.ts) to
 * provide more functionality in a more dynamic way to capture injected
 * objects from the level 2 sdk (ex: during an onClick)
 */

import * as u from '@jsmanifest/utils'
import { GotoObject } from 'noodl-types'
import {
  ConsumerOptions,
  NUIAction,
  NUIActionGroupedType,
  NUIActionObject,
  Store,
} from 'noodl-ui'
import App from '../App'

export type ActionKind = 'action' | 'builtIn'

export type ActionHandlerArgs =
  | [destination: string, ...rest: any[]]
  | [obj: NUIActionObject | { pageName: string; goto: string }, ...rest: any[]]
  | Parameters<Store.ActionObject['fn']>
  | Parameters<Store.BuiltInObject['fn']>

export interface MiddlewareObject {
  id: string
  fn: MiddlewareFn | null
}

export interface MiddlewareFn {
  (args: ActionHandlerArgs): Promise<ActionHandlerArgs> | ActionHandlerArgs
}

export type StoreActionObject<
  T extends Exclude<NUIActionGroupedType, 'anonymous'> | 'builtIn' | 'emit',
> = T extends 'builtIn' ? Store.BuiltInObject : Store.ActionObject<T>

class Middleware {
  #id = ''
  #middleware: MiddlewareObject
  #run: MiddlewareObject['fn']

  constructor(middleware: MiddlewareObject) {
    this.#id = middleware?.id
    this.#middleware = middleware
    this.#run = middleware.fn
  }

  run(args: any[]) {
    // this.#run(args)
    return args
  }
}

const actionFactory = function (app: App) {
  const middlewares = [] as MiddlewareObject[]

  /**
   *
   * @param { ActionHandlerArgs } args
   * @returns { Promise<any>[] }
   */
  async function runMiddleware(args: ActionHandlerArgs) {
    args = u.array(args)
    await Promise.all(middlewares.map(async (mo) => mo.fn?.(args)))
    return args
  }

  /**
   * Adds a new middleware object containing the function which will be called
   * with the incoming args when actions call their handlers
   * @param { string } id
   * @param { MiddlewareFn } fn
   */
  function _createMiddleware(id: string, fn?: MiddlewareFn): Middleware
  function _createMiddleware(fn: MiddlewareFn): Middleware
  function _createMiddleware(id: string | MiddlewareFn, fn?: MiddlewareFn) {
    middlewares.push({
      id: u.isStr(id) ? id : '',
      fn: u.isFnc(id) ? id : u.isFnc(fn) ? fn : null,
    })
  }

  /**
   * @param { string } kind
   * @param { Store.ActionObject['fn'] | Store.BuiltInObject['fn'] } fn
   * @returns { Store.ActionObject['fn'] | Store.BuiltInObject['fn'] }
   */
  function _createActionHandler(
    kind?: 'action' | Store.ActionObject['fn'],
  ): Store.ActionObject['fn']

  function _createActionHandler(
    kind: 'builtIn' | Store.BuiltInObject['fn'] | never,
    fn?: Store.BuiltInObject['fn'],
  ): Store.BuiltInObject['fn']

  function _createActionHandler<K extends ActionKind>(
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
      if (!action) {
        return console.log(
          `%cA function handler was invoked but the argument received was ` +
            `empty. The function will not continue`,
          `color:#FF5722;`,
          { arguments },
        )
      }

      try {
        let _action: NUIAction | undefined

        // if (u.isStr(action)) {
        //   // Goto action (page navigation)
        //   const destination = action
        //   _action = createAction({
        //     action: { actionType: 'goto', goto: destination },
        //     trigger: 'onClick',
        //   })
        // } else if (isAction(action)) {
        //   _action = action
        //   if (!options) {
        //     //
        //   }
        // } else if (u.isObj(action)) {
        //   if (
        //     [Identify.action.any, Identify.folds.emit, Identify.goto].some(
        //       (identify) => identify(action),
        //     )
        //   ) {
        //     _action = createAction({ action, trigger: 'onClick' })
        //   } else {
        //     //
        //   }
        // }

        let args = [action, options, ...rest]
        await runMiddleware(args)

        return _fn?.(...args)
      } catch (error) {
        throw error
      }
    }
  }

  return {
    createActionHandler(fn: Store.ActionObject['fn']) {
      return _createActionHandler(fn)
    },
    createBuiltInHandler(fn: Store.ActionObject['fn']) {
      return _createActionHandler('builtIn', fn)
    },
    createMiddleware(idProp: string | MiddlewareFn, fnProp?: MiddlewareFn) {
      let id = u.isStr(idProp) ? idProp : ''
      let fn = u.isFnc(idProp) ? idProp : u.isFnc(fnProp) ? fnProp : null
      let middleware: MiddlewareFn = (args) => (u.isFnc(fn) ? fn(args) : args)
      _createMiddleware(id, middleware)
    },
  }
}

export default actionFactory
