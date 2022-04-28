import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import { getCurrent } from '@/utils/immer'
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

  const { handleBuiltInFn, ...builtIns } = useBuiltInFns()

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
                rootKey: pageCtx.pageName,
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
          const dataObject = pageCtx.getDataObject(args.component)
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
          if (!u.isStr(value)) debugger
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
      log.debug(
        `%c[executeEvalBuiltIn] Calling --> ${builtInKey}`,
        'color:salmon',
        { from: args.from },
      )
      const result = await handleBuiltInFn(builtInKey, {
        actionChain: args.actionChain,
        dataObject: args.dataObject,
        ...builtInArgs,
      })
      log.debug(
        `%c[executeEvalBuiltIn] Result <-- ${builtInKey}`,
        'color:salmon',
        result,
      )
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

        log.debug(
          `%c[evalObject] Calling object ${index + 1}/${numObjs}`,
          'color:teal',
          {
            ...args,
            action: object,
            from: args.from,
            index: objs.indexOf(object),
            value: object,
          },
        )

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
                datapath.unshift(pageCtx.pageName)
              }

              if (u.isStr(propValue)) {
                datavalue = is.reference(propValue)
                  ? deref({
                      root: getRootDraftOrRoot(args.actionChain),
                      rootKey: pageCtx.pageName,
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
          log.debug(`%c[executeIf] Calling --> executeStr`, `color:#c4a901;`, {
            from: args.from,
            value: cond,
          })
          value = await executeStr?.(cond, { ...args, action: cond })
          log.debug(`%c[executeIf] Result <-- executeStr`, `color:#c4a901;`, {
            valueCalledExecuteStrWith: cond,
            result: value,
          })
        }

        if (isBuiltInEvalFn(cond)) {
          const key = u.keys(cond)[0] as string
          log.debug(
            `%c[executeIf] Calling --> executeEvalBuiltIn`,
            `color:#c4a901;`,
            { builtInKey: key, from: args.from },
          )
          const result = await executeEvalBuiltIn(key, {
            ...args,
            ...cond[key],
            from: 'if',
          })
          value = result ? truthy : falsy
          log.debug(
            `%c[executeIf] Result <-- executeEvalBuiltIn`,
            `color:#c4a901;`,
            {
              resultFromCallingBuiltIn: result,
              result: value,
            },
          )
        }

        if (value === 'continue') {
          log.debug(`%c[executeIf] continue`, { from: args.from })
          return value
        } else if (u.isStr(value)) {
          if (is.reference(value)) {
            const valueBefore = value
            value = await executeStr?.(value, {
              ...args,
              action: value,
              from: 'if',
            })
            log.debug(`%c[executeIf] --> executeStr`, `color:#c4a901;`, {
              from: args.from,
              valueCalledExecuteStrWith: valueBefore,
              resultFromCallingExecuteStr: value,
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
                  debugger
                  log.debug(`%c[executeIf] Encountered @: ${k}`, 'color:gold')
                  const keyDataPath = trimReference(k)
                  const rootDraft = getRootDraftOrRoot(args.actionChain)
                  if (is.localReference(k)) {
                    set(rootDraft[pageCtx.pageName], keyDataPath, v)
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
        const dataObject = pageCtx.getDataObject(component) || {}

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
                      log.debug(`Received "abort"`)
                      results.push('abort')
                      break
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
              if (funcName === 'redraw') {
                const { viewTag } = obj
                if (viewTag) {
                  const el = document.querySelector(`[data-viewtag=${viewTag}]`)
                  if (el) {
                    //
                  }
                }
                debugger
              }
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

              const visibilityBefore = el?.style?.visibility

              if (el) {
                el.style.visibility =
                  obj.actionType === 'popUpDismiss' ? 'hidden' : 'visible'
              } else {
                log.error(
                  `The popUp component with popUpView "${obj.popUpView}" is not in the DOM`,
                  obj,
                )
              }

              log.debug(
                `[${obj.actionType}] visibility: ${visibilityBefore} --> ${el?.style?.visibility}`,
                '',
                obj,
              )
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
                  log.debug(`%c[${key}]`, `color:#01a7c4;`, { from, result })
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
                        dataPath.unshift(pageCtx.pageName)
                      }
                      value = get(rootDraft, dataPath)
                    }
                  }

                  if (isAwaiting) {
                    let dataPath = toDataPath(trimReference(key)).filter(
                      Boolean,
                    )
                    if (isLocal) {
                      if (
                        pageCtx.pageName &&
                        dataPath[0] !== pageCtx.pageName
                      ) {
                        dataPath.unshift(pageCtx.pageName)
                      }
                      let valueAwaiting = obj[key]
                      let initialValue = get(rootDraft, dataPath)
                      // let initialValue = getR(dataPath.join('.'))

                      if (is.reference(valueAwaiting)) {
                        valueAwaiting = get(rootDraft, dataPath.join('.'))
                      }

                      set(rootDraft, dataPath, valueAwaiting)

                      const valueAfter = get(rootDraft, dataPath)

                      if (initialValue == valueAfter) {
                        log.error(
                          `Applied a value to the awaiting path "${obj[key]}" but the value remained the same`,
                          {
                            awaitKey,
                            path: dataPath,
                            pageName: pageCtx.pageName,
                            valueAwaiting,
                            valueBefore: initialValue,
                            valueAfter,
                          },
                        )
                      } else {
                        log.debug(
                          `%cApplied the awaited value`,
                          'color:green',
                          {
                            awaitKey,
                            path: dataPath,
                            pageName: pageCtx.pageName,
                            valueAwaiting,
                            valueBefore: initialValue,
                            valueAfter,
                          },
                        )
                      }
                    } else {
                      log.error('DEBUG THIS PART IF U SEE THIS')
                      log.error('DEBUG THIS PART IF U SEE THIS')
                      log.error('DEBUG THIS PART IF U SEE THIS')
                      const incKey = toDataPath(trimReference(key))
                      const incValue = getR(rootDraft, incKey)
                      console.log({
                        awaitKey,
                        incKey,
                        incValue,
                        root: rootDraft,
                        pageName: pageCtx.pageName,
                        value,
                      })

                      set(rootDraft, incKey, value)
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
              debugger
              const result = await execute({
                action: obj,
                actionChain,
                component,
                event,
                trigger,
              })
              debugger
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

        debugger
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
