import * as u from '@jsmanifest/utils'
import type {
  ConsumerOptions,
  NDOMPage,
  NUIActionObject,
  Store,
} from 'noodl-ui'
import { isAction } from 'noodl-action-chain'
import { createAction } from 'noodl-ui'
import log from '../../log'
import App from '../../App'
import { ActionEvent } from '../../constants'
import * as c from '../../constants'
import type { AppStateActionEvent, ObjectWithPriority } from '../../app/types'

export type MiddlewareConfig = ObjectWithPriority<{
  id?: string
  cond?: (args: MiddlewareActionHandlerArgs) => boolean
  fn: MiddlewareFn
  end?: <Ctx extends Record<string, any> = Record<string, any>>(
    args: MiddlewareActionHandlerArgs,
    options: MiddlewareFnOptions<Ctx>,
  ) => Promise<void> | void
}>

export interface MiddlewareFn<R = any> {
  (args: MiddlewareActionHandlerArgs, options: MiddlewareFnOptions):
    | Promise<R | 'abort' | void>
    | R
    | 'abort'
    | void
}

export interface MiddlewareFnOptions<
  Ctx extends Record<string, any> = Record<string, any>,
> {
  app: App
  context: Ctx
}

export type MiddlewareActionHandlerArgs =
  | Parameters<Store.ActionObject['fn']>
  | Parameters<Store.BuiltInObject['fn']>
  | [destination: string, rest: any]
  | [obj: NUIActionObject | { pageName: string; goto: string }, rest: any]

/**
 * This file contains middleware functions wrapping functions from
 * src/actions.ts and src/builtIns.ts
 */
function getMiddlewares() {
  const middlewares = [
    {
      priority: 1,
      id: 'handle-injections-middleware',
      /**
       * Transforms abnormal args to the expected [action, options] structure
       * Useful to handle dynamically injected actions (goto strings for
       * destinations for example)
       */
      fn: function onHandleInjectionsMiddleware(args, { app }) {
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
            try {
              args[1].page = app.ndom.findPage(currentPage)
            } catch (error) {
              //
            }
          }
        }
      },
    },
    (function () {
      return {
        id: c.actionMiddlewareLogKey.BUILTIN_GOTO_EXECUTION_TIME,
        priority: 1,
        // @ts-expect-error
        cond: (args): args is [{ destination: string }, any] =>
          u.isObj(args?.[0]) && 'destination' in args[0],
        fn: async function onBuiltInGotoExecutionTimeStart(
          args,
          { app, context },
        ) {
          const key = c.actionMiddlewareLogKey.BUILTIN_GOTO_EXECUTION_TIME
          const start = performance.now()
          const injectedObject = args?.[0] as { destination: string }
          context[key] = {
            title: key,
            date: Date.now(),
            mediaType: 'application/json',
            currentPage: app.currentPage,
            destination: injectedObject?.destination,
            start,
          }
        },
        end: async function onBuiltInGotoExecutionTimeEnd(_, { app, context }) {
          const key = c.actionMiddlewareLogKey.BUILTIN_GOTO_EXECUTION_TIME
          const rootNotebookID = app.root.Global?.rootNotebookID
          const { title, date, mediaType, currentPage, destination, start } =
            context?.[key] || {}
          const end = performance.now() - start

          const doc = await app.root.builtIn.utils.createPerformanceLog({
            type: 10101,
            title,
            edge_id: rootNotebookID,
            mediaType,
            tags: ['log'],
            content: {
              date,
              currentPage,
              destination,
              env: window.build?.ecosEnv,
              buildTimestamp: window.build?.timestamp,
              size: end,
              userAgent: navigator?.userAgent,
            },
          })
          console.log(`[onBuiltInGotoExecutionTimeEnd] Log created`, doc)
        },
      }
    })(),
    {
      id: 'actions-event-state-middleware',
      priority: 5,
      /**
       * TODO - Continue implementation
       * @param args
       * @param param1
       */
      fn: function onActionsEventStateMiddleware(args, { app }) {
        if (u.isArr(args)) {
          if (isAction(args[0])) {
            const type = args[0]?.actionType

            if (u.isStr(type)) {
              if (type === 'goto') {
                const actionEvent: AppStateActionEvent = {
                  type: 'action',
                  kind: ActionEvent.Goto,
                  status: 'ready',
                  timestamp: Date.now(),
                }
                app.getState().actionEvents.push(actionEvent)
              } else {
                //
              }
            }
          }
        }

        if (app.getState().actionEvents.length > 50) {
          while (app.getState().actionEvents.length > 50) {
            const actionEvents = app.getState().actionEvents
            actionEvents.shift()
          }
        }
      },
    },
    {
      id: 'prevent-another-goto-when-currently-navigating-middleware',
      priority: 5,
      fn: function onPreventAnotherGotoWhenCurrentlyNavigatingMiddleware(
        args,
        { app },
      ) {
        const action = args?.[0]

        if (isAction(action)) {
          const options = args?.[1] as ConsumerOptions

          if (options?.page) {
            const page = app.ndom.findPage(options?.page) as NDOMPage

            if (page) {
              const pendingPage = page.requesting
              const currentPage = page.page
              let newPageRequesting = ''

              if (u.isStr(action.original?.goto)) {
                newPageRequesting = action.original?.goto
              } else if (u.isObj(action.original?.goto)) {
                if (u.isStr(action.original?.goto.destination)) {
                  newPageRequesting = action.original?.goto.destination
                }
              }

              if (pendingPage && currentPage && newPageRequesting) {
                if (pendingPage !== currentPage) {
                  if (
                    pendingPage !== newPageRequesting &&
                    !pendingPage.startsWith('https://search')
                  ) {
                    // This block is reached when the user clicks several buttons too fast and it tries to navigate to all of the pages in the onClicks.
                    // Prevent the goto
                    log.error(
                      `Preventing another goto because there is another one already in process`,
                    )
                    // TODO - Finish implementing 'abort' logic
                    return 'abort'
                    // debugger
                  }
                }
              }
            }
          }
          // }
        }
      },
    },
  ] as MiddlewareConfig[]

  return middlewares
}

export default getMiddlewares
