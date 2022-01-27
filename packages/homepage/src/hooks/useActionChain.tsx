import React from 'react'
import get from 'lodash/get'
import * as nt from 'noodl-types'
import { navigate } from 'gatsby'
import { excludeIteratorVar, trimReference } from 'noodl-utils'
import { isAction, isActionChain } from 'noodl-action-chain'
import {
  createAction,
  createActionChain as nuiCreateActionChain,
  NUI as nui,
} from 'noodl-ui'
import type {
  NUIAction,
  NUIActionObject,
  NUIActionChain,
  NuiComponent,
  NUITrigger,
} from 'noodl-ui'
import * as u from '@jsmanifest/utils'
import useBuiltInFns from '@/hooks/useBuiltInFns'
import * as t from '@/types'
import { getListDataObject } from '@/utils/pageCtx'
import useCtx from '@/useCtx'
import usePageCtx from '@/usePageCtx'
import is from '@/utils/is'

export interface UseActionChainOptions {}

function useActionChain() {
  const { pages: root } = useCtx()
  const pageCtx = usePageCtx()
  const builtIns = useBuiltInFns()

  const createEmit = React.useCallback(
    (
      component: t.StaticComponentObject,
      trigger: NUITrigger,
      emitObject: nt.EmitObjectFold,
    ) => {
      const action = createAction({ action: emitObject, trigger })

      const { dataObject, iteratorVar = '' } = getListDataObject(
        pageCtx._context_.lists,
        component,
        { include: ['iteratorVar'] },
      )

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

                  results.push(result)
                }
              } catch (error) {
                const err =
                  error instanceof Error ? error : new Error(String(error))
                console.error(
                  `%c[${err.name}] ${err.message}`,
                  'color:tomato',
                  err,
                )
              }

              console.log(
                `%c[onExecuteEmitAction] Emit actions (results)`,
                `color:#00b406;`,
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
    async ({
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
    }) => {
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
          if (u.isObj(destination)) {
            debugger
          }
          if (root[destination]) {
            return navigate(`/${destination}`)
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
            debugger
          } else if (is.folds.if(obj)) {
            const [cond, truthy, falsy] = obj.if || []
            let value

            if (builtIns.isBuiltInEvalFn(cond)) {
              const key = u.keys(cond)[0] as string
              const result = await builtIns.handleBuiltInFn(key, {
                dataObject,
                ...cond[key],
              })
              value = result ? truthy : falsy
              console.log(`%c[if][${key}] Result`, `color:#c4a901;`, result)
            }

            console.log(`%c[if] Result`, `color:#c4a901;`, value)

            if (value === 'continue') {
              //
            } else if (u.isObj(value)) {
              if (is.folds.goto(value)) {
                return execute({ action: value.goto })
              } else if (is.action.popUp(value)) {
                // TODO - Dismiss on touch outside
                // TODO - get element by popUpView
                // TODO - Wait
              }
            } else {
              debugger
            }

            return value
          } else {
            const keys = u.keys(obj)
            let result

            if (keys.length === 1) {
              const key = keys[0] as string
              if (builtIns.isBuiltInEvalFn(obj)) {
                result = await builtIns.handleBuiltInFn(key, {
                  dataObject,
                  ...obj[key],
                })
                console.log(`%c[${key}] Result`, `color:#01a7c4;`, result)
              }
            }

            return result
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        u.logError(err)
      }
    },
    [],
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
            console.log(
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
          console.log(
            `%c[${trigger}-onExecuteStart] ${actionChain.id}`,
            `color:skyblue`,
            getArgs(arguments),
          )
        },
        onExecuteEnd() {
          console.log(
            `%c[${trigger}-onExecuteEnd] ${actionChain.id}`,
            `color:skyblue`,
            getArgs(arguments),
          )
        },
        onExecuteError() {
          console.error(
            `%c[${trigger}-onExecuteError]`,
            `color:tomato`,
            getArgs(arguments),
          )
        },
        onAbortError() {
          console.error(
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
