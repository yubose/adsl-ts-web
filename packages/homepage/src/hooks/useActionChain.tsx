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
} from 'noodl-ui'
import type { NUIActionObject, NUIActionChain, NUITrigger } from 'noodl-ui'
import useBuiltInFns from '@/hooks/useBuiltInFns'
import isBuiltInEvalFn from '@/utils/isBuiltInEvalFn'
import useCtx from '@/useCtx'
import deref from '@/utils/deref'
import { usePageCtx } from '@/components/PageContext'
import is from '@/utils/is'
import log from '@/utils/log'
import * as c from '../constants'
import * as t from '@/types'

export interface UseActionChainOptions {}

export interface ExecuteArgs {
  action: Record<string, any> | string
  actionChain: NUIActionChain
  component?: t.StaticComponentObject
  dataObject?: any
  event?: React.SyntheticEvent
  from?: 'evalObject' | 'goto' | 'if'
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
      let scrollingTo = ''

      if (is.reference(value)) {
        value =
          value === '.WebsitePathSearch'
            ? // Temp hard code for now
              'https://search.aitmed.com'
            : deref({
                root: getRootDraftOrRoot(args.actionChain),
                ref: value,
                rootKey: pageCtx.name,
              })
      }

      // These are values coming from an if object evaluation since we are also using this function for if object strings
      if (is.isBoolean(value)) return is.isBooleanTrue(value)

      if (u.isObj(value)) {
        debugger
      } else if (u.isStr(value)) {
        if (value.startsWith('^')) {
          // TODO - Handle goto scrolls when navigating to a different page
          scrollingTo = value.substring(1)
          value = value.replace('^', '')
        } else if (pageCtx.isListConsumer(args.component)) {
          const iteratorVar = pageCtx.getIteratorVar(args.component)
          const dataObject = pageCtx.getDataObject(
            args.component,
            getRootDraftOrRoot(args.actionChain),
            pageCtx.name,
          )
          if (iteratorVar && value.startsWith(iteratorVar)) {
            value = get(dataObject, excludeIteratorVar(value, iteratorVar))
          }
        }
      }

      if (!value?.startsWith?.('http') && (value || scrollingTo)) {
        let scrollingToElem: HTMLElement | undefined
        let prevId = ''
        if (scrollingTo) {
          scrollingToElem = document.querySelector(
            `[data-viewtag=${scrollingTo}]`,
          )
          if (scrollingToElem) {
            prevId = scrollingToElem.id
            scrollingToElem.id = scrollingTo
          } else {
            log.error(
              `Tried to find an element of viewTag "${scrollingTo}" but it did not exist`,
            )
          }
        }

        if (scrollingToElem && prevId) {
          scrollingToElem.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
          })
        } else {
          navigate(`/${value}`)
        }
      } else {
        window.location.href = value
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
      const result = await handleBuiltInFn(builtInKey, {
        actionChain: args.actionChain,
        dataObject: args.dataObject,
        ...args,
        ...builtInArgs,
      })
      return result
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
          from: 'evalObject',
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
          value = await executeStr?.(cond, { ...args, action: cond })
        }

        if (isBuiltInEvalFn(cond)) {
          const key = u.keys(cond)[0] as string
          const result = await executeEvalBuiltIn(key, {
            ...args,
            ...cond[key],
            from: 'if',
          })
          value = result ? truthy : falsy
        }

        if (value === 'continue') {
          return value
        } else if (u.isStr(value)) {
          if (is.reference(value)) {
            value = await executeStr?.(value, {
              ...args,
              action: value,
              from: 'if',
            })
          }
        } else if (u.isBool(value)) {
          value = value ? truthy : falsy
        }

        if (u.isObj(value)) {
          if (args.requiresDynamicHandling(value)) {
            for (const [k, v] of u.entries(value)) {
              if (is.reference(k)) {
                if (k.endsWith('@')) {
                  const keyDataPath = trimReference(k)
                  const rootDraft = getRootDraftOrRoot(args.actionChain)
                  if (is.localReference(k)) {
                    set(rootDraft[pageCtx.name], keyDataPath, v)
                  } else {
                    set(rootDraft, keyDataPath, v)
                  }
                }
              }
            }
          } else {
            value = await wrapWithHelpers(args.onExecuteAction)({
              action: value,
              actionChain: args.actionChain,
              component: args.component,
              event: args.event,
              from: 'if',
              trigger: args.trigger,
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

  const createEmit = (
    actionChain: NUIActionChain,
    component: t.StaticComponentObject,
    trigger: NUITrigger,
    emitObject: nt.EmitObjectFold,
  ) =>
    React.useMemo(() => {
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
            action.dataKey = u.reduce(
              u.entries(action.dataKey),
              (acc, [key, value]) => {
                if (iteratorVar) {
                  if (value === iteratorVar) {
                    acc[key] = dataObject
                  } else {
                    acc[key] = get(
                      iteratorVar,
                      `${excludeIteratorVar(value, iteratorVar)}`,
                    )
                  }
                } else {
                  acc[key] = get(dataObject, value)
                }
                return acc
              },
              {},
            )
          }

          action.executor = (function (actions: any[] = [], dataObject) {
            return async function onExecuteEmitAction(
              event: React.SyntheticEvent,
            ) {
              try {
                const results = [] as any[]

                try {
                  for (const actionObject of actions) {
                    const result = await execute({
                      action: actionObject,
                      actionChain,
                      component,
                      dataObject,
                      event,
                      trigger,
                    })

                    if (result === 'abort') {
                      results.push('abort')
                      action.abort('Received abort')
                      await actionChain.abort()
                      return 'abort'
                    } else results.push(result)
                  }
                } catch (error) {
                  const err =
                    error instanceof Error ? error : new Error(String(error))
                  log.error(`%c[${err.name}] ${err.message}`, err)
                }

                return results
              } catch (error) {
                log.error(
                  error instanceof Error ? error : new Error(String(error)),
                )
              }
            }
          })(emitObject.emit.actions, dataObject)

          return action
        } else {
          // TODO
        }
      }
    }, [pageCtx, root])

  /**
   * Wraps and provides helpers to the execute function as the 2nd argument
   */
  const wrapWithHelpers = React.useMemo(
    () => (fn: (args: ExecuteArgs, helpers: ExecuteHelpers) => Promise<any>) => {
      return function (args: ExecuteArgs) {
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
        const {
          action: obj,
          actionChain,
          component,
          dataObject,
          event,
          from,
          trigger = '',
        } = options
        try {
          // TEMP sharing goto destinations and some strings as args
          if (u.isStr(obj)) {
            const result = await executeStr(obj, { ...options, ...utils })
            return result
          } else if (u.isObj(obj)) {
            // { goto: "SignIn" }
            if (is.goto(obj)) {
              let destination = obj.goto
              if (u.isObj(destination)) destination = destination.goto
              if (u.isStr(destination)) {
                return executeStr(destination, {
                  ...options,
                  ...utils,
                  action: destination,
                })
              } else {
                throw new Error(`Goto destination was not a string`)
              }
            }
            // { actionType: 'builtIn', funcName: 'redraw' }
            else if (is.action.builtIn(obj)) {
              const funcName = obj.funcName
              log.debug(`[builtIn-${funcName}]`, obj)
            }
            // { emit: { dataKey: {...}, actions: [...] } }
            else if (is.folds.emit(obj)) {
              debugger
            }
            // // { actionType: 'evalObject', object: [...] }
            else if (is.action.evalObject(obj)) {
              const result = await executeEvalObject(obj, {
                ...options,
                ...utils,
                action: obj,
                actionChain,
                component,
                dataObject,
                event,
                trigger,
                onExecuteAction,
              })
              return result
            }
            // { if: [...] }
            else if (is.folds.if(obj)) {
              const result = await executeIf(obj, {
                action: obj,
                actionChain,
                component,
                dataObject,
                event,
                from: 'if',
                onExecuteAction,
                trigger,
                ...utils,
              })
              return result
            }
            // { actionType: 'popUp', popUpView: 'myPopUp', wait: true }
            else if (
              [is.action.popUp, is.action.popUpDismiss].some((fn) => fn(obj))
            ) {
              // TODO - Dismiss on touch outside
              // TODO - Wait
              const el = document.querySelector(
                `[data-viewtag=${obj.popUpView}]`,
              ) as HTMLElement

              if (el) {
                el.style.visibility =
                  obj.actionType === 'popUpDismiss' ? 'hidden' : 'visible'
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

              if (keys.length === 1) {
                const key = keys[0] as string

                // { "=.builtIn.string.equal": { ...} }
                if (isBuiltInEvalFn(obj)) {
                  result = await handleBuiltInFn(key, {
                    actionChain,
                    dataObject,
                    ...obj[key],
                  })
                } else {
                  let awaitKey
                  let isLocal = true
                  let value = obj[key]
                  let rootDraft = getRootDraftOrRoot(actionChain)

                  if (is.reference(key)) {
                    isLocal = is.localReference(key)
                    isAwaiting = is.awaitReference(key)
                    if (isAwaiting) awaitKey = key
                  }

                  if (u.isStr(value)) {
                    if (is.reference(value)) {
                      const dataPath = toDataPath(trimReference(value))
                      if (is.localReference(value)) {
                        dataPath.unshift(pageCtx.name)
                      }
                      value = get(rootDraft, dataPath)
                    }
                  }

                  if (isAwaiting) {
                    let dataPath = toDataPath(trimReference(key)).filter(
                      Boolean,
                    )
                    if (isLocal) {
                      if (pageCtx.name && dataPath[0] !== pageCtx.name) {
                        dataPath.unshift(pageCtx.name)
                      }
                      let valueAwaiting = obj[key]

                      if (is.reference(valueAwaiting)) {
                        valueAwaiting = get(rootDraft, dataPath.join('.'))
                      }

                      set(rootDraft, dataPath, valueAwaiting)
                    } else {
                      log.error('DEBUG THIS PART IF U SEE THIS')
                      set(rootDraft, toDataPath(trimReference(key)), value)
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
          const err = error instanceof Error ? error : new Error(String(error))
          log.error(err)
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
        !u.isArr(actions) && (actions = [actions])

        const loadActions = (
          component: Partial<t.StaticComponentObject>,
          actionObjects: nt.ActionObject[],
        ) => {
          return actionObjects.map((obj) => {
            if (is.folds.emit(obj)) {
              return createEmit(actionChain, component, trigger, obj)
            }

            const nuiAction = createAction({ action: obj, trigger })

            nuiAction.executor = async function onExecuteAction(
              event: React.SyntheticEvent,
            ) {
              const result = await execute({
                action: obj,
                actionChain,
                component,
                event,
                trigger,
              })

              if (result) {
                log.debug(
                  `%c[${nuiAction.actionType}]${
                    is.action.builtIn(obj) ? ` ${obj.funcName}` : ''
                  } Execute result`,
                  `color:#ee36df;`,
                  result,
                )
              }
            }

            return nuiAction
          })
        }

        const actionChain = nuiCreateActionChain(
          trigger,
          actions,
          partial(loadActions, component),
        )

        const getArgs = function (args: IArguments | any[]) {
          if (args.length) {
            args = Array.from(args).filter(Boolean)
            return args.length ? args : ''
          }
          return ''
        }

        actionChain.use({
          onExecuteStart(this: NUIActionChain) {
            log.debug(
              `%c[${trigger}-onExecuteStart] ${actionChain.id}`,
              `color:skyblue`,
              getArgs(arguments),
            )
          },
          onExecuteEnd(this: NUIActionChain) {
            log.debug(
              `%c[${trigger}-onExecuteEnd] ${actionChain.id}`,
              `color:skyblue`,
              this && this.snapshot(),
            )
          },
        })

        actionChain.loadQueue()
        return actionChain
      }
    },
    [pageCtx, root],
  )

  return {
    createActionChain,
    getRootDraftOrRoot,
  }
}

export default useActionChain
