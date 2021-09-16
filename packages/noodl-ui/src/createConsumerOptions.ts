// @ts-nocheck
import curry from 'lodash/curry'
import { ActionChainObserver } from 'noodl-action-chain'
import { OrArray } from '@jsmanifest/typefest'
import { createEmitDataKey } from 'noodl-utils'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as c from './constants'
import * as t from './types'
import cache from './_cache'
import NuiPage from './Page'
import getActionObjectErrors from './utils/getActionObjectErrors'
import getActionType from './utils/getActionType'
import { findIteratorVar, findListDataObject } from './utils/noodl'
import { promiseAllSafely } from './utils/common'
import { getHelpers } from './noodl-ui'

export type Helpers = ReturnType<typeof getHelpers>

export interface ConsumerGetters {
  getAssetsUrl?: any
  getBaseUrl?: any
  getBaseStyles?: any
  getCache?: any
  getPages?: any
  getPreloadPages?: any
  getQueryObjects?: any
  getRoot?: any
  getRootPage?: any
}

export interface ResolveOptions {
  callback?(
    component: t.NuiComponent.Instance,
  ): t.NuiComponent.Instance | undefined
  component?: t.NuiComponent.Instance
  on?: t.ResolveComponentOptions<any>['on']
  page?: NuiPage
  context?: Record<string, any>
}

const createConsumerOptions = curry(
  (helpers: Helpers, getters: ConsumerGetters, options: ResolveOptions) => {
    const o = {
      cache,
      ...helpers,
      ...getters,
      ...options,
      createActionChain(
        trigger: t.NUITrigger,
        actions: t.NUIActionObject | t.NUIActionObject[],
        {
          context: contextProp,
          loadQueue = true,
        }: { context?: Record<string, any>; loadQueue?: boolean } = {},
      ) {
        return _createActionChain(trigger, actions, {
          loadQueue,
          context: { ...context, ...contextProp },
          component: options.component,
          on: options.on,
          page: options.page || getters.getRootPage(),
        })
      },
      createSrc(key: string, value: string | nt.IfObject | nt.EmitObjectFold) {
        return helpers.createSrc({
          key,
          value,
          component: options.component,
          page: options.page || getters.getRootPage(),
        })
      },
      get page() {
        return options.page || getters.getRootPage()
      },
      get resolveComponents() {
        return helpers.resolveComponents
      },
    }

    function _createActionChain(
      trigger: t.NUITrigger,
      actions: OrArray<t.NUIActionObjectInput>,
      opts?: ActionChainObserver & {
        component?: t.NuiComponent.Instance
        context?: Record<string, any>
        on?: t.ResolveComponentOptions<any, any>['on']
        loadQueue?: boolean
        page?: NuiPage
      },
    ) {
      if (!u.isArr(actions)) actions = [actions]

      const actionChain = helpers.createActionChain({
        actions: u.reduce(
          actions,
          (acc: t.NUIActionObject[], obj) => {
            const errors = getActionObjectErrors(obj)
            errors.length &&
              errors.forEach((errMsg) =>
                console.log(`%c${errMsg}`, `color:#ec0000;`, obj),
              )
            if (u.isObj(obj) && !('actionType' in obj)) {
              obj = { ...obj, actionType: getActionType(obj) }
            } else if (u.isFnc(obj)) {
              obj = { actionType: 'anonymous', fn: obj }
            }
            return acc.concat(obj as t.NUIActionObject)
          },
          [],
        ),
        trigger,
        loader: (objs) => {
          function __createExecutor(
            action: t.NUIAction,
            fns: (t.Store.ActionObject | t.Store.BuiltInObject)[] = [],
            options: t.ConsumerOptions,
          ) {
            return async function executeActionChain(event?: Event) {
              let results = [] as (Error | any)[]
              if (fns.length) {
                const callbacks = fns.map(
                  async (obj: t.Store.ActionObject | t.Store.BuiltInObject) =>
                    obj.fn?.(action as any, {
                      ...options,
                      component: opts?.component,
                      event,
                      ref: actionChain,
                    }),
                )
                results = await promiseAllSafely(
                  callbacks,
                  (err, result) => err || result,
                )
              }
              return results.length < 2 ? results[0] : results
            }
          }

          return objs.map((obj) => {
            if (nt.Identify.folds.emit(obj)) {
              const action = helpers.createAction(trigger, obj)
              if (opts?.component) {
                const iteratorVar =
                  opts?.context?.iteratorVar || findIteratorVar(opts.component)

                const dataObject =
                  opts?.context?.dataObject ||
                  findListDataObject(opts.component)

                if (obj.emit?.dataKey) {
                  action.dataKey = createEmitDataKey(
                    obj.emit.dataKey,
                    getters.getQueryObjects({
                      component: opts.component,
                      page: opts.page,
                      listDataObject: dataObject,
                    }),
                    { iteratorVar },
                  )
                }
              }

              const callbacks = cache.actions.emit?.get(trigger) || []

              action.executor = __createExecutor(action, callbacks, {
                ...o,
                context: opts?.context,
                component: opts?.component,
                on: opts?.on,
                page: opts?.page as NuiPage,
              })

              return action
            }

            const action = helpers.createAction(trigger, obj)

            action.executor = __createExecutor(
              action,
              nt.Identify.action.builtIn(obj)
                ? cache.actions.builtIn.get(obj.funcName as string)
                : nt.Identify.goto(obj)
                ? cache.actions.goto
                : cache.actions[obj.actionType] || [],
              {
                ...o,
                context: opts?.context,
                component: opts?.component,
                on: opts?.on,
                page: opts?.page as NuiPage,
              },
            )

            return action
          })
        },
      })

      opts?.loadQueue && actionChain.loadQueue()
      opts?.on?.actionChain && actionChain.use(opts.on.actionChain)

      return actionChain
    }

    return o
  },
)

export default createConsumerOptions
