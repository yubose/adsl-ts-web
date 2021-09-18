import * as u from '@jsmanifest/utils'
import { isAction, isActionChain } from 'noodl-action-chain'
import { createAction } from 'noodl-ui'
import { ActionHandlerArgs, MiddlewareFn } from '../../factories/actionFactory'
import Logger from 'logsnap'
import App from '../../App'

/**
 * This file contains middleware functions wrapping functions from
 * src/actions.ts and src/builtIns.ts
 */

const registerMiddleware = function (app: App) {
  const log = Logger.create('middlewares.ts')

  /**
   * Transforms abnormal args to the expected [action, options] structure
   * Useful to handle dynamically injected actions (goto strings for
   * destinations for ex)
   */
  const handleInjections: MiddlewareFn = (
    args: ActionHandlerArgs,
  ): ActionHandlerArgs => {
    if (u.isStr(args[0])) {
      const prevArgs = [...args]
      if (!prevArgs[1]) {
        args[1] = app.nui.getConsumerOptions({
          page: app.mainPage.getNuiPage(),
        })
      }
      // Dynamically injected goto action from lvl 2
      args[0] = createAction({
        action: { actionType: 'goto', goto: args[0] },
        trigger: 'onClick',
      })

      log.func('handleInjections')
      log.green(
        `A goto destination of "${prevArgs[0]}" was dynamically injected into an action chain`,
        { prevArgs, newArgs: args },
      )
    } else if (u.isObj(args[0]) && !isAction(args[0])) {
      const prevArgs = [...args]

      if ('destination' in args[0]) {
        // Dynamically injected plain objects as potential actions from lvl 2
        args[0] = createAction({
          action: { actionType: 'goto', goto: args[0]?.destination },
          trigger: 'onClick',
        })
      }

      log.func('handleInjections')
      log.green(
        `An action object was dynamically injected into an action chain`,
        { prevArgs, newArgs: args },
      )
    }

    if (!args[1]) {
      args[1] = app.nui.getConsumerOptions({
        page: app.mainPage.getNuiPage(),
      })
    }

    if (isAction(args[0])) {
      args[1] = { ...args[1], snapshot: args[0].snapshot() }
    }

    if ('ref' in args[1] || isActionChain(args[1]?.ref)) {
      // debugger
    }

    return args
  }

  return {
    handleInjections,
  }
}

export default registerMiddleware
