import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import React from 'react'
import get from 'lodash/get'
import set from 'lodash/set'
import { navigate } from 'gatsby'
import { excludeIteratorVar, trimReference } from 'noodl-utils'
import {
  createAction,
  createActionChain as nuiCreateActionChain,
  NUIActionChain,
} from 'noodl-ui'
import type { NUIActionObject, NUITrigger } from 'noodl-ui'
import useBuiltInFns from '@/hooks/useBuiltInFns'
import * as t from '@/types'
import { getListDataObject } from '@/utils/pageCtx'
import isBuiltInEvalFn from '@/utils/isBuiltInEvalFn'
import useCtx from '@/useCtx'
import usePageCtx from '@/usePageCtx'
import is from '@/utils/is'
import log from '@/utils/log'

export interface UseActionChainOptions {}

function useActionChain() {
  const { pages: root, set: setInRoot } = useCtx()
  const pageCtx = usePageCtx()
  const { handleBuiltInFn, ...builtIns } = useBuiltInFns()

  const createEmit = React.useCallback(
    (
      component: t.StaticComponentObject,
      trigger: NUITrigger,
      emitObject: nt.EmitObjectFold,
    ) => {
      const action = createAction({ action: emitObject, trigger })

      const { dataObject, iteratorVar = '' } =
        getListDataObject(pageCtx._context_.lists, component, {
          include: ['iteratorVar'],
        }) || {}

      if (dataObject) {
        if (u.isStr(action.dataKey)) {
          action.dataKey = dataObject
        } else if (u.isObj(action.dataKey)) {
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

        action.executor = (function (actions = [], dataObject) {
          return async function onExecuteEmitAction(event) {
            try {
              const results = [] as any[]
              try {
                for (const actionObject of actions) {
                  const result = await execute({
                    action: actionObject,
                    component,
                    dataObject,
                    event,
                    trigger,
                  })
                  if (result === 'abort') break
                  else results.push(result)
                }
              } catch (error) {
                const err =
                  error instanceof Error ? error : new Error(String(error))
                log.error(`%c[${err.name}] ${err.message}`, err)
              }
              log.debug(
                `%c[onExecuteEmitAction] Emit actions (results)`,
                'color:gold',
                results,
              )

              return results
            } catch (error) {
              u.logError(error)
            }
          }
        })(emitObject.emit.actions, dataObject)

        return action
      } else {
        // TODO
      }
    },
    [pageCtx],
  )

  const execute = React.useCallback(
    async function onExecuteAction({
      action: obj,
      component,
      dataObject,
      event,
      trigger = '',
    }: {
      action: Record<string, any> | string
      component?: t.StaticComponentObject
      dataObject?: any
      event?: React.SyntheticEvent
      trigger?: NUITrigger | ''
    }) {
      try {
        // TEMP sharing goto destinations as args
        if (u.isStr(obj)) {
          let destination = obj

          if (is.reference(destination)) {
            const dataPathStr = trimReference(destination)

            if (is.localReference(destination)) {
              destination = get(root[pageCtx.pageName], dataPathStr)
            } else {
              destination = get(root, dataPathStr)
            }
          }

          // These are values coming from an if object evaluation since we are also using this function for if object strings
          if (is.isBoolean(destination)) return is.isBooleanTrue(destination)

          let scrollingTo = ''

          if (u.isObj(destination)) {
            // debugger
          } else if (u.isStr(destination)) {
            if (destination.startsWith('^')) {
              scrollingTo = destination.substring(1)
              destination = destination.replace('^', '#')
            }
          }

          if (root[destination] || scrollingTo) {
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
              return scrollingToElem.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
              })
            } else {
              return navigate(`/${destination}`)
            }
          } else {
            return (window.location.href = destination)
          }
        } else if (u.isObj(obj)) {
          if (is.goto(obj)) {
            let destination = obj.goto
            if (u.isObj(destination)) destination = destination.goto
            if (u.isStr(destination)) {
              return execute({ action: destination })
            } else {
              throw new Error(`Goto destination was not a string`)
            }
          } else if (is.action.builtIn(obj)) {
            const funcName = obj.funcName
            if (funcName === 'redraw') {
              const { viewTag } = obj
              if (viewTag) {
                const el = document.querySelector(`[data-viewtag=${viewTag}]`)
                if (el) {
                }
              }
            }
          } else if (is.folds.emit(obj)) {
          } else if (is.action.evalObject(obj)) {
            for (const object of u.array(obj.object)) {
              if (u.isObj(object)) {
                const result = await onExecuteAction({
                  action: object,
                  component,
                  dataObject,
                  event,
                  trigger,
                })
                log.debug(
                  `%c[evalObject] object call result`,
                  `color:salmon;`,
                  result,
                )
                if (is.action.popUp(result) || is.action.popUpDismiss(result)) {
                  const el = document.querySelector(
                    `[data-viewtag=${result.popUpView}]`,
                  ) as HTMLElement
                  if (el) {
                    el.style.visibility =
                      result.actionType === 'popUpDismiss'
                        ? 'visible'
                        : 'hidden'
                    console.log(el.style.visibility)
                  } else {
                    log.error(
                      `The popUp component with popUpView "${result.popUpView}" is not in the DOM`,
                      result,
                    )
                  }
                }
              }
            }
          } else if (is.folds.if(obj)) {
            let [cond, truthy, falsy] = (obj.if || []) as any[]
            let value: any

            if (u.isStr(cond)) {
              value = await onExecuteAction({ action: cond })
            } else if (isBuiltInEvalFn(cond)) {
              const key = u.keys(cond)[0] as string
              const result = await handleBuiltInFn(key, {
                dataObject,
                ...cond[key],
              })
              value = result ? truthy : falsy
              log.debug(`%c[if][${key}] Returned:`, `color:#c4a901;`, result)
            }

            log.debug(`%c[if] Result`, `color:#c4a901;`, {
              dataObject,
              ifObject: obj,
              result: value,
            })

            if (value === 'continue') {
              //
            } else if (u.isStr(value)) {
              if (is.reference(value)) {
                value = await onExecuteAction({ action: value })
              }
            } else if (u.isBool(value)) {
              value = value ? truthy : falsy
            }

            if (u.isObj(value)) {
              if (is.folds.goto(value)) {
                await execute({ action: value.goto })
                value = 'abort'
              } else if (is.action.popUp(value)) {
                // TODO - Dismiss on touch outside
                // TODO - get element by popUpView
                // TODO - Wait
                value = 'abort'
              } else {
                for (const [k, v] of u.entries(value)) {
                  if (is.reference(k)) {
                    if (k.endsWith('@')) {
                      let keyDataPath = trimReference(k)
                      setInRoot((draft) => {
                        let dataObject = draft.pages
                        if (is.localReference(k)) {
                          dataObject = draft[pageCtx.pageName]
                        }
                        set(dataObject, keyDataPath, v)
                      })
                    }
                  }
                }
              }
            }

            return value
          } else {
            const keys = u.keys(obj)
            let result

            if (keys.length === 1) {
              const key = keys[0] as string
              if (isBuiltInEvalFn(obj)) {
                result = await handleBuiltInFn(key, {
                  dataObject,
                  ...obj[key],
                })
                log.debug(`%c[${key}] Result`, `color:#01a7c4;`, result)
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
        u.logError(err)
      }
    },
    [root, pageCtx.pageName],
  )

  const createActionChain = React.useCallback(
    (
      component: t.StaticComponentObject,
      trigger: NUITrigger,
      actions?: NUIActionObject | NUIActionObject[],
    ) => {
      !u.isArr(actions) && (actions = [actions])

      const actionChain = nuiCreateActionChain(trigger, actions, (actions) => {
        return actions.map((obj) => {
          if (is.folds.emit(obj)) return createEmit(component, trigger, obj)

          const nuiAction = createAction({ action: obj, trigger })

          nuiAction.executor = async function onExecuteAction(
            event: React.SyntheticEvent,
          ) {
            const result = await execute({
              action: obj,
              component,
              event,
              trigger,
            })
            log.debug(
              `%c[${nuiAction.actionType}]${
                is.action.builtIn(obj) ? ` ${obj.funcName}` : ''
              } Execute result`,
              `color:#ee36df;`,
              result || '<empty>',
            )
          }
          return nuiAction
        })
      })

      const getArgs = function (args: IArguments | any[]) {
        if (args.length) {
          args = [...args].filter(Boolean)
          return args.length ? args : ''
        }
        return ''
      }

      actionChain.use({
        onExecuteStart() {
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
            this.snapshot(),
          )
        },
        onExecuteError() {
          log.error(
            `%c[${trigger}-onExecuteError]`,
            `color:tomato`,
            getArgs(arguments),
          )
        },
        onAbortError() {
          log.error(
            `%c[${trigger}-onAbortError]`,
            `color:tomato`,
            getArgs(arguments),
          )
        },
      })

      actionChain.loadQueue()
      return actionChain
    },
    [],
  )

  return {
    createActionChain,
  }
}

export default useActionChain
