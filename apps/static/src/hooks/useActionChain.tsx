import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import React from 'react'
import get from 'lodash/get'
import set from 'lodash/set'
import partial from 'lodash/partial'
import { navigate } from 'gatsby'
import { excludeIteratorVar, trimReference, toDataPath } from 'noodl-utils'
import {
  createAction,
  createActionChain as nuiCreateActionChain,
  deref,
} from 'noodl-ui'
import type { NUIActionObject, NUIActionChain, NUITrigger } from 'noodl-ui'
import { handleSamePageScroll } from '@/utils/actionUtils'
import is from '@/utils/is'
import isBuiltInEvalFn from '@/utils/isBuiltInEvalFn'
import log from '@/utils/log'
import useBuiltInFns from '@/hooks/useBuiltInFns'
import useCtx from '@/useCtx'
import { createDraft, finishDraft, isDraft, toCurrent } from '@/utils/immer'
import { usePageCtx } from '@/components/PageContext'
import * as c from '../constants'
import * as t from '@/types'

export interface UseActionChainOptions {}

export interface ExecuteArgs {
  action: Record<string, any> | string
  actionChain: NUIActionChain
  component?: t.StaticComponentObject
  dataObject?: any
  event?: React.SyntheticEvent
  trigger?: NUITrigger | ''
}

export interface ExecuteHelpers {
  requiresDynamicHandling: (obj: any) => boolean
}

function useActionChain() {
  const { root, getR, setR } = useCtx()
  const pageCtx = usePageCtx()
  const { handleBuiltInFn } = useBuiltInFns()

  const getRootDraftOrRoot = React.useCallback(
    (actionChain: NUIActionChain) => {
      return actionChain?.data?.get?.(c.ROOT_DRAFT) || root
    },
    [root],
  )

  const executeStr = async (
    value: string,
    args: ExecuteArgs &
      ExecuteHelpers & {
        onExecuteAction?: (
          args: ExecuteArgs,
          helpers: ExecuteHelpers,
        ) => Promise<any>
      },
  ) => {
    try {
      if (is.reference(value)) {
        if (value === '.WebsitePathSearch') {
          return (window.location.href = 'https://search.aitmed.com')
        }
        value = deref({
          root: getRootDraftOrRoot(args.actionChain),
          ref: value,
          rootKey: pageCtx.name,
        })
        // These are values coming from an if object evaluation since we are also using this function for if object strings
        if (is.isBoolean(value)) return is.isBooleanTrue(value)
        if (u.isObj(value)) log.error(`REMINDER: LOOK INTO THIS PART`)
      }

      if (value.startsWith('http')) {
        window.location.href = value
      } else if (value.startsWith('^')) {
        await handleSamePageScroll(navigate, value)
      } else {
        await navigate(`/${value}/index.html`)
      }

      // This can get picked up if evalObject is returning a goto
      return 'abort'
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    }
  }

  const executeEvalBuiltIn = async (
    builtInKey: string,
    {
      builtInArgs,
      ...args
    }: ExecuteArgs &
      ExecuteHelpers & {
        onExecuteAction?: (
          args: ExecuteArgs,
          helpers: ExecuteHelpers,
        ) => Promise<any>
      } & { builtInArgs?: any },
  ) => {
    try {
      return handleBuiltInFn(builtInKey, { ...args, ...builtInArgs })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    }
  }

  const executeEvalObject = async (
    value: nt.EvalActionObject,
    args: ExecuteArgs &
      ExecuteHelpers & {
        onExecuteAction?: (
          args: ExecuteArgs,
          helpers: ExecuteHelpers,
        ) => Promise<any>
      },
  ) => {
    try {
      const results = []
      const objs = u.array(value.object)
      const numObjs = objs.length
      for (let index = 0; index < numObjs; index++) {
        const object = objs[index]

        if (u.isObj(object)) {
          const objKeys = u.keys(object)
          const isSingleProperty = objKeys.length === 1

          if (isSingleProperty) {
            const property = objKeys[0]
            const propValue = object[property]

            if (is.awaitReference(property)) {
              let datapath = toDataPath(trimReference(property))
              let datavalue: any

              if (is.localReference(property)) {
                datapath.unshift(pageCtx.name)
              }

              if (u.isStr(propValue)) {
                datavalue = is.reference(propValue)
                  ? deref({
                      root: getRootDraftOrRoot(args.actionChain),
                      rootKey: pageCtx.name,
                      ref: propValue,
                    })
                  : propValue
              } else {
                datavalue = propValue
              }

              if (is.action.evalObject(datavalue)) {
                const result = await execute({
                  ...args,
                  action: datavalue,
                })
                if (result !== undefined) {
                  set(getRootDraftOrRoot(args.actionChain), datapath, result)
                }
              } else {
                set(getRootDraftOrRoot(args.actionChain), datapath, datavalue)
              }
              continue
            } else {
              // debugger
            }
          }
        }

        const result = await wrapWithHelpers(args.onExecuteAction)({
          ...args,
          action: object,
        })
        results.push(result)
      }
      return results
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    }
  }

  const executeIf = React.useCallback(
    async (
      ifObject: nt.IfObject,
      args: ExecuteArgs &
        ExecuteHelpers & {
          onExecuteAction?: (
            args: ExecuteArgs,
            helpers: ExecuteHelpers,
          ) => Promise<any>
        },
    ) => {
      try {
        let [cond, truthy, falsy] = (ifObject.if || []) as any[]
        let value: any

        if (u.isStr(cond)) {
          if (is.reference(cond)) {
            value = await executeStr?.(cond, { ...args, action: cond })
          } else {
            value = cond
          }
        }

        if (isBuiltInEvalFn(cond)) {
          const key = u.keys(cond)[0] as string
          const result = await executeEvalBuiltIn(key, {
            ...args,
            ...cond[key],
          })
          value = result ? truthy : falsy
        }

        if (value === 'continue') {
          return value
        } else if (u.isStr(value)) {
          if (is.reference(value)) {
            value = await executeStr?.(value, { ...args, action: value })
          }
        } else if (u.isBool(value)) {
          value = value ? truthy : falsy
        }

        if (u.isObj(value)) {
          // TODO - Replace requiresDynamicHandling with is.dynamicAction
          if (args.requiresDynamicHandling(value)) {
            for (let [k, v] of u.entries(value)) {
              if (is.reference(v)) {
                const rootDraft = getRootDraftOrRoot(args.actionChain)
                if (is.localReference(v)) {
                  v = get(rootDraft[pageCtx.name], trimReference(v))
                } else {
                  v = get(rootDraft, trimReference(v))
                }
              }
              if (is.reference(k)) {
                // { k: '..imgData@', v: '=..imgDataNext' }
                if (k.endsWith('@')) {
                  const keyDataPath = trimReference(k)
                  const rootDraft = getRootDraftOrRoot(args.actionChain)
                  if (is.localReference(k)) {
                    set(rootDraft[pageCtx.name], keyDataPath, v)
                  } else {
                    set(rootDraft, keyDataPath, v)
                  }
                } else {
                  console.error(`REMINDER: LOOK INTO THIS IMPLEMENTATION`)
                }
              } else {
                const rootDraft = getRootDraftOrRoot(args.actionChain)
                set(rootDraft, k, v)
              }
            }
          } else {
            value = await wrapWithHelpers(args.onExecuteAction)({
              ...args,
              action: value,
            })
          }
        }

        return value
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        throw err
      }
    },
    [],
  )

  const createEmit = React.useCallback(
    (
      actionChain: NUIActionChain,
      component: t.StaticComponentObject,
      trigger: NUITrigger,
      emitObject: nt.EmitObjectFold,
    ) => {
      {
        const action = createAction({ action: emitObject, trigger })
        const dataObject =
          pageCtx.getDataObject(
            component,
            getRootDraftOrRoot(actionChain),
            pageCtx.name,
          ) || {}

        if (dataObject) {
          if (u.isStr(action.dataKey)) {
            action.dataKey = dataObject
          } else if (u.isObj(action.dataKey)) {
            const iteratorVar = pageCtx.getIteratorVar(component)
            action.dataKey = u.entries(action.dataKey).reduce(
              (acc, [key, value]) =>
                u.assign(acc, {
                  [key]: iteratorVar
                    ? value === iteratorVar
                      ? dataObject
                      : get(
                          iteratorVar,
                          `${excludeIteratorVar(value, iteratorVar)}`,
                        )
                    : get(dataObject, value),
                }),
              {},
            )
          }

          /**
           * Beginning of actionChain.execute()
           */
          action.executor = (function (actions: any[] = [], dataObject) {
            return async function onExecuteEmitAction() {
              let draftedActionObject: any
              let results = [] as any[]

              try {
                for (const actionObject of actions) {
                  draftedActionObject = createDraft(actionObject)
                  const result = await execute({
                    action: deref({
                      dataObject,
                      iteratorVar: component?.iteratorVar,
                      ref: draftedActionObject,
                      root: getRootDraftOrRoot(actionChain),
                      rootKey: pageCtx.name,
                    }),
                    actionChain,
                    component,
                    dataObject,
                    trigger,
                  })
                  finishDraft(draftedActionObject)
                  draftedActionObject = undefined
                  if (result === 'abort') {
                    results.push('abort')
                    action.abort('Received abort')
                    await actionChain.abort()
                    return 'abort'
                  } else results.push(result)
                }

                return results
              } catch (error) {
                log.error(
                  error instanceof Error ? error : new Error(String(error)),
                )
              } finally {
                if (draftedActionObject) finishDraft(draftedActionObject)
              }
            }
          })(emitObject.emit.actions, dataObject)

          return action
        } else {
          // TODO
        }
      }
    },
    [pageCtx, root],
  )

  /**
   * Wraps and provides helpers to the execute function as the 2nd argument
   */
  const wrapWithHelpers = React.useMemo(
    () => (fn: (args: ExecuteArgs, helpers: ExecuteHelpers) => Promise<any>) => {
      return async function (args: ExecuteArgs) {
        return fn(args, {
          requiresDynamicHandling: (obj: any) => {
            return (
              u.isObj(obj) &&
              [is.folds.emit, is.folds.goto, is.folds.if, is.action.any].every(
                (pred) => !pred(obj),
              )
            )
          },
        })
      }
    },
    [],
  )

  const execute = React.useMemo(
    () =>
      wrapWithHelpers(async function onExecuteAction(options, utils) {
        let { action: obj, actionChain, dataObject } = options
        const args = { ...options, ...utils, onExecuteAction }

        try {
          // TEMP sharing goto destinations and some strings as args
          if (u.isStr(obj)) {
            return executeStr(obj, args)
          } else if (u.isObj(obj)) {
            // { goto: "SignIn" }
            if (is.goto(obj)) {
              let destination = obj.goto
              if (u.isObj(destination)) destination = destination.goto
              if (u.isStr(destination)) {
                return executeStr(destination, { ...args, action: destination })
              } else {
                throw new Error(`Goto destination was not a string`)
              }
            }
            // { actionType: 'builtIn', funcName: 'redraw' }
            else if (is.action.builtIn(obj)) {
              const funcName = obj.funcName
              // log.debug(`%c[builtIn] ${funcName}`, 'color:hotpink', obj)
            }
            // { emit: { dataKey: {...}, actions: [...] } }
            else if (is.folds.emit(obj)) {
              log.error(`REMINDER: IMPLEMENT EXECUTE EMIT OBJECT`)
              for (const action of u.array(obj.emit.actions)) {
                if (is.folds.if(action)) {
                  await executeIf(action, {
                    ...args,
                    ...utils,
                    onExecuteAction,
                  })
                }
              }
            }
            // { actionType: 'evalObject', object: [...] }
            else if (is.action.evalObject(obj)) {
              return executeEvalObject(obj, args)
            }
            // { if: [...] }
            else if (is.folds.if(obj)) {
              // @ts-expect-error
              return executeIf(obj, args)
            }
            // { actionType: 'popUp', popUpView: 'myPopUp', wait: true }
            else if (
              [is.action.popUp, is.action.popUpDismiss].some((fn) => fn(obj))
            ) {
              const selector = `[data-viewtag=${obj.popUpView}]`
              const el = document.querySelector(selector) as HTMLElement
              const isPopUpDismiss = is.action.popUpDismiss(obj)

              if (el) {
                if (isPopUpDismiss) {
                  el.style.visibility = 'hidden'
                } else {
                  el.style.visibility = 'visible'

                  if (obj.dismissOnTouchOutside) {
                    function registerDismissOnTouchOutsideListener() {
                      function registerListener(event: MouseEvent) {
                        const target = event.target as HTMLElement
                        if (!el.contains(target)) el.style.visibility = 'hidden'
                        document.removeEventListener('click', registerListener)
                      }

                      document.removeEventListener(
                        'click',
                        registerDismissOnTouchOutsideListener,
                      )

                      document.addEventListener('click', registerListener)
                    }

                    document.addEventListener(
                      'click',
                      registerDismissOnTouchOutsideListener,
                    )
                  }
                }
              } else {
                log.error(
                  `The popUp component with popUpView "${obj.popUpView}" is not in the DOM`,
                  obj,
                )
              }
              // TODO - See if we need to move this logic elsewhere
              // 'abort' is returned so evalObject can abort if it returns popups
              return 'wait' in obj ? 'abort' : undefined
            } else {
              let keys = u.keys(obj)
              let isAwaiting = false
              let result: any
              let args = { actionChain, dataObject }

              if (keys.length === 1) {
                const key = keys[0] as string
                // { "=.builtIn.string.equal": { ...} }
                if (isBuiltInEvalFn(obj)) {
                  result = await handleBuiltInFn(key, { ...args, ...obj[key] })
                } else {
                  let awaitKey: string
                  let isLocal = true
                  let value = obj[key]
                  let rootDraft = getRootDraftOrRoot(actionChain)

                  if (is.reference(key)) {
                    isLocal = is.localReference(key)
                    isAwaiting = is.awaitReference(key)
                    if (isAwaiting) awaitKey = key
                  }

                  if (u.isStr(value) && is.reference(value)) {
                    const dataPath = toDataPath(trimReference(value))
                    if (is.localReference(value)) dataPath.unshift(pageCtx.name)
                    value = get(rootDraft, dataPath)
                  }

                  if (isAwaiting) {
                    const path = toDataPath(trimReference(key)).filter(Boolean)
                    if (isLocal) {
                      if (pageCtx.name && path[0] !== pageCtx.name) {
                        path.unshift(pageCtx.name)
                      }
                      const valueAwaiting = is.reference(obj[key])
                        ? get(rootDraft, path.join('.'))
                        : obj[key]
                      set(rootDraft, path, valueAwaiting)
                    }
                  } else {
                    result = value
                  }
                }
              } else {
                log.error(
                  `%cAn action in an action chain is not being handled`,
                  `color:#ec0000;`,
                  obj,
                )
              }
              return result
            }
          }
        } catch (error) {
          log.error(error instanceof Error ? error : new Error(String(error)))
        }
      }),
    [handleBuiltInFn, isBuiltInEvalFn, getR, setR, pageCtx, root],
  )

  const createActionChain = React.useCallback(
    (
      component: Partial<t.StaticComponentObject>,
      trigger: NUITrigger,
      actions?: NUIActionObject | NUIActionObject[],
    ) => {
      {
        if (!u.isArr(actions)) actions = [actions]

        const loadActions = (
          component: t.StaticComponentObject,
          actionObjects: nt.ActionObject[],
        ) =>
          actionObjects.map((obj) => {
            if (is.folds.emit(obj)) {
              return createEmit(actionChain, component, trigger, obj)
            }
            const nuiAction = createAction({ action: obj, trigger })
            nuiAction.executor = execute.bind(null, {
              action: obj,
              actionChain,
              component,
              trigger,
            })
            return nuiAction
          })

        const actionChain = nuiCreateActionChain(
          trigger,
          actions,
          partial(loadActions, component),
        )

        actionChain.loadQueue()
        return actionChain
      }
    },
    [pageCtx, root],
  )

  return {
    createActionChain,
    createEmit,
    execute,
    executeEvalBuiltIn,
    executeEvalObject,
    executeIf,
    executeStr,
    getRootDraftOrRoot,
  }
}

export default useActionChain
