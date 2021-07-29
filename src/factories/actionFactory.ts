import * as u from '@jsmanifest/utils'
import { isAction } from 'noodl-action-chain'
import { ConsumerOptions, createAction, Store } from 'noodl-ui'
import createActionHandler, {
  createMiddleware,
  MiddlewareFn,
} from '../utils/createActionHandler'
import App from '../App'
import * as t from '../app/types'

/**
 * The actionFactory is in its experimental phase and is meant to wrap
 * actions in src/handlers/actions.ts (or src/handlers/builtIns.ts) to
 * provide more functionality in a more dynamic way to capture injected
 * objects from the level 2 sdk (ex: during an onClick)
 */

const actionFactory = function (app: App) {
  return {
    createMiddleware: (...args: Parameters<typeof createMiddleware>) => {
      let id = u.isStr(args[0]) ? args[0] : ''
      let fn = u.isFnc(args[0]) ? args[0] : u.isFnc(args[1]) ? args[1] : null
      createMiddleware(id, (a, o) => {
        fn?.(a, { ...o, app })
        return a
      })
    },
  }
}

export default actionFactory
