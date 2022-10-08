/**
 * TODO - Move middlewares to noodl-ui
 *
 * The actionFactory is in its experimental phase and is meant to wrap
 * actions in src/handlers/actions.ts (or src/handlers/builtIns.ts) to
 * provide more functionality in a more dynamic way to capture injected
 * objects from the level 2 sdk (ex: during an onClick)
 */

import * as u from '@jsmanifest/utils'
import type {
  ConsumerOptions,
  NUIActionGroupedType,
  NUIActionObject,
  Store,
} from 'noodl-ui'
import type App from '../App'

export type ActionKind = 'action' | 'builtIn'

export type ActionHandlerArgs =
  | [destination: string, rest: any]
  | [obj: NUIActionObject | { pageName: string; goto: string }, rest: any]
  | Parameters<Store.ActionObject['fn']>
  | Parameters<Store.BuiltInObject['fn']>

export interface MiddlewareObject {
  id: string
  fn: MiddlewareFn | null
}

export interface MiddlewareFn {
  (args: ActionHandlerArgs, options: MiddlewareFnOptions): Promise<void> | void
}

export interface MiddlewareFnOptions {
  app: App
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

export function actionFactory(app: App) {
  const middlewares = [] as MiddlewareObject[]

  /**
   * @param { ActionHandlerArgs } args
   * @returns { Promise<any>[] }
   */
  async function runMiddleware(args: ActionHandlerArgs) {
    for (const middleware of middlewares) {
      const control = await middleware.fn?.(args, { app })
      if (control) {
        if (control === 'abort') return 'abort'
      }
    }
    return args
  }

  /**
   * Adds a new middleware object containing the function which will be called
   * with the incoming args when actions call their handlers
   * @param { string } id
   * @param { MiddlewareFn } fn
   */
  // @ts-expect-error
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
  // @ts-expect-error
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
        const args = [action, options, ...rest]
        const res = await runMiddleware(args as ActionHandlerArgs)
        if (res === 'abort') return
        // @ts-expect-error
        return _fn?.(...args)
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  const o = {
    createActionHandler(fn: Store.ActionObject['fn']) {
      return _createActionHandler(fn)
    },
    createBuiltInHandler(fn: Store.ActionObject['fn']) {
      return _createActionHandler('builtIn', fn)
    },
    createMiddleware(idProp: string | MiddlewareFn, fnProp?: MiddlewareFn) {
      const id = u.isStr(idProp) ? idProp : ''
      const fn = u.isFnc(idProp) ? idProp : u.isFnc(fnProp) ? fnProp : null
      if (fn) _createMiddleware(id, fn)
    },
  }

  return o
}
