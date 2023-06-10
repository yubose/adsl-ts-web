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
} from '../handlers/shared/middlewares'

export type ActionKind = 'action' | 'builtIn'

export type StoreActionObject<
  T extends Exclude<NUIActionGroupedType, 'anonymous'> | 'builtIn' | 'emit',
> = T extends 'builtIn' ? Store.BuiltInObject : Store.ActionObject<T>

export function actionFactory(app: App) {
  const middlewares = [] as MiddlewareConfig[]

  function isCondTrue(
    cond: MiddlewareConfig['cond'],
    args: MiddlewareActionHandlerArgs,
  ) {
    return u.isFnc(cond) && cond(args) === true
  }

  async function runMiddlewareEndFns(
    middlewares: MiddlewareConfig[],
    args: MiddlewareActionHandlerArgs,
    opts: MiddlewareFnOptions,
  ) {
    return Promise.all(
      middlewares.map(
        (m) => u.isFnc(m.end) && isCondTrue(m.cond, args) && m.end(args, opts),
      ),
    )
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

      let context = {} as any
      let control: any

      // @ts-expect-error
      const args = [action, options, ...rest] as MiddlewareActionHandlerArgs
      const opts = { app, context } as MiddlewareFnOptions

      for (const middleware of middlewares) {
        if (!isCondTrue(middleware.cond, args)) {
          continue
        } else {
          control = await middleware.fn?.(args, opts)
          if (control === 'abort') break
        }
      }

      let result: any

      if (control !== 'abort') {
        // @ts-expect-error
        result = await _fn?.(...args)
      }

      await runMiddlewareEndFns(middlewares, args, opts)

      return result
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
