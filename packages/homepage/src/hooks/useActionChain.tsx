import React from 'react'
import get from 'lodash/get'
import { Location, useNavigate } from '@reach/router'
import * as nt from 'noodl-types'
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
import is from '../utils/is'

export interface UseActionChainOptions {}

function useActionChain({}: UseActionChainOptions = {}) {
  const navigate = useNavigate()

  const builtIns = useBuiltInFns()

  const createActionChain = React.useCallback(
    (trigger: NUITrigger, actions?: NUIActionObject | NUIActionObject[]) => {
      !u.isArr(actions) && (actions = [actions])
      const actionChain = nuiCreateActionChain(trigger, actions, (actions) => {
        return actions.map((obj) => {
          const nuiAction = createAction({ action: obj, trigger })

          nuiAction.executor = async function onExecuteAction(
            event: React.SyntheticEvent,
          ) {
            if (is.goto(obj)) {
              let destination = obj.goto
              if (u.isObj(destination)) destination = destination.goto
              if (nui.getPages().includes(destination)) {
                console.log(
                  `%cEncountered inbound destination: ${destination}`,
                  `color:#00b406;`,
                )
                navigate(destination)
              } else {
                console.log(
                  `%cEncountered outbound destination: ${destination}`,
                  `color:hotpink;`,
                )
                window.location.href = destination
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
              let { dataKey } = obj.emit || {}
              let dataObject = actionChain.data.get('dataObject')

              if (u.isStr(dataKey)) {
                dataKey = dataObject
              } else if (u.isObj(dataKey)) {
                dataKey = u
                  .entries({ ...dataKey })
                  .reduce((acc, [key, value]) => {
                    // Hard code for now to get things working quickly then come back later to do an official implementation
                    // debugger
                    if (value === 'itemObject') {
                      acc[key] = dataObject
                    } else {
                      acc[key] = get(
                        dataObject,
                        value.replace('itemObject.', ''),
                      )
                    }
                    return acc
                  }, {})
                const newEmitObject = { ...obj, emit: { ...obj.emit, dataKey } }
                newEmitObject?.actions?.forEach((action) => {
                  if (
                    u.isObj(action) &&
                    '=.builtIn.object.setProperty' in action
                  ) {
                    builtIns['=.builtIn.object.setProperty'](dataObject)
                  }
                })
              }
            }
            console.log({ event, obj, nuiAction })
          }

          return nuiAction
        })
      })

      const getArgs = function (args: IArguments | any[]) {
        if (args.length) {
          args = [...args].filter(Boolean)
          return args.length ? { args } : ''
        }
        return ''
      }

      actionChain.use({
        onAbortStart() {
          console.log(`[onAbortStart]`, getArgs(arguments))
        },
        onBeforeActionExecute() {
          console.log(`[onBeforeActionExecute]`, getArgs(arguments))
        },
        onExecuteStart() {
          console.log(`[onExecuteStart]`, getArgs(arguments))
        },
        onExecuteEnd() {
          console.log(`[onExecuteEnd]`, getArgs(arguments))
        },
        onExecuteResult() {
          console.log(`[onExecuteResult]`, getArgs(arguments))
        },
        onExecuteError() {
          console.log(`[onExecuteError]`, getArgs(arguments))
        },
        onAbortError() {
          console.log(`[onAbortError]`, getArgs(arguments))
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
