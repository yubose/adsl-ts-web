import * as u from '@jsmanifest/utils'
import { isAction } from 'noodl-action-chain'
import { createAction } from 'noodl-ui'
import { ActionHandlerArgs, MiddlewareFn } from '../../factories/actionFactory'
import App from '../../App'

/**
 * This file contains middleware functions wrapping functions from
 * src/actions.ts and src/builtIns.ts
 */
const middlewares = function (app: App) {
  /**
   * Transforms abnormal args to the expected [action, options] structure
   * Useful to handle dynamically injected actions (goto strings for
   * destinations for example)
   */
  const handleInjections: MiddlewareFn = (
    args: ActionHandlerArgs,
  ): ActionHandlerArgs => {
    const originalArgs = [...args]

    // Dynamically injected goto destination from lvl 3
    if (u.isStr(args[0])) {
      const prevArgs = [...args]
      // Create missing options
      if (!prevArgs[1]) {
        args[1] = app.nui.getConsumerOptions({
          page: app.mainPage.getNuiPage(),
        })
      }
      // Dynamically injected goto object from lvl 3.
      // Convert to a noodl-ui Action
      args[0] = createAction({
        action: { actionType: 'goto', goto: args[0] },
        trigger: 'onClick',
      })
    }

    // Dynamically injected goto object from lvl 3
    else if (u.isObj(args[0]) && !isAction(args[0])) {
      if ('destination' in args[0] || 'goto' in args[0]) {
        // Convert to a noodl-ui Action
        args[0] = createAction({
          action: {
            actionType: 'goto',
            goto: args[0]?.['destination'] || args[0]?.goto,
          },
          trigger: 'onClick',
        })
      }
    }

    if (!args[1]) {
      // Create options argument if missing
      args[1] = app.nui.getConsumerOptions({
        page: app.mainPage.getNuiPage(),
      })
    }

    // TODO - Where is "pageName" coming from?
    if (u.isObj(originalArgs[0]) && 'pageName' in originalArgs[0]) {
      const currentPage = originalArgs[0].pageName || ''
      if (args[1]?.page && args[1].page.page !== currentPage) {
        // Replace the NDOM page with a matching NDOM page
        args[1].page = app.ndom.findPage(currentPage)
      }
    }
  }

  return {
    handleInjections,
  }
}

export default middlewares
