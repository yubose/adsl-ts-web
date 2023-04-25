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
import log from '../log'
import type {
  MiddlewareConfig,
  MiddlewareActionHandlerArgs,
  MiddlewareFnOptions,
  MiddlewareFn,
} from '../handlers/shared/middlewares'

export type ActionKind = 'action' | 'builtIn'

export type StoreActionObject<
  T extends Exclude<NUIActionGroupedType, 'anonymous'> | 'builtIn' | 'emit',
> = T extends 'builtIn' ? Store.BuiltInObject : Store.ActionObject<T>

export function actionFactory(app: App) {
  const middlewares = [] as MiddlewareConfig[]

  async function runMiddleware(args: MiddlewareActionHandlerArgs) {
    let context = {} as any

    for (const middleware of middlewares) {
      if (u.isFnc(middleware.cond) && middleware.cond(args) === false) {
        continue
      } else {
        const opts = { app, context } as MiddlewareFnOptions
        const control = await middleware.fn?.(args, opts)
        if (control) {
          if (control === 'abort') {
            if (middleware.end) await middleware.end(args, opts)
            return 'abort'
          }
        }
        if (middleware.end) await middleware.end(args, opts)
      }
    }

    return args
  }

  /**
   * @param { string } kind
   * @param { Store.ActionObject['fn'] | Store.BuiltInObject['fn'] } fn
   * @returns { Store.ActionObject['fn'] | Store.BuiltInObject['fn'] }
   */
  // @ts-expect-error
  function _createActionHandler(
    kind?: Store.ActionObject['fn'] | 'action',
  ): Store.ActionObject['fn']

  function _createActionHandler(
    kind: Store.BuiltInObject['fn'] | never | 'builtIn',
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
            | NUIActionObject
            | Store.ActionObject['fn']
            | Store.BuiltInObject['fn']
            | string,
      options?: ConsumerOptions,
      ...rest: any[]
    ) {
      if (!action) {
        return log.log(
          `%cA function handler was invoked but the argument received was ` +
            `empty. The function will not continue`,
          `color:#FF5722;`,
          { arguments },
        )
      }

      try {
        const args = [action, options, ...rest]
        const res = await runMiddleware(args as MiddlewareActionHandlerArgs)
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
    createMiddleware(middleware: MiddlewareConfig) {
      middlewares.push(middleware)
    },
  }

  return o
}
