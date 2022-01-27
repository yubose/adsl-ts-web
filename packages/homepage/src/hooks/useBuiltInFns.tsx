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
import useCtx from '../useCtx'
import is from '../utils/is'

function useBuiltInFns() {
  const navigate = useNavigate()
  const ctx = useCtx()

  const builtIns = React.useMemo(
    () => ({
      isBuiltInEvalFn: (value: Record<string, any>) => {
        for (const key of u.keys(value)) {
          if (key.startsWith('=.builtIn')) return true
        }
        return false
      },
      handleBuiltInFn: (key = '', ...args: any[]) => {
        const fn = builtIns[key]
        if (u.isFnc(fn)) {
          return (fn as any)(...args)
        } else {
          console.log(
            `%cYou are missing the builtIn implementation for "${key}"`,
            `color:#ec0000;`,
          )
        }
      },
      [`=.builtIn.string.equal`]: ({ dataObject, dataIn }) => {
        let str1 = String(dataIn?.string1 || '')
        let str2 = String(dataIn?.string2 || '')
        if (u.isObj(dataObject)) {
          for (const str of [str1, str2]) {
            if (str.startsWith('$')) {
              const paths = str.split('.').slice(1)
              if (str === str1) str1 = get(dataObject, paths)
              else str2 = get(dataObject, paths)
            }
          }
        }
        return str1 === str2
      },
      [`=.builtIn.object.setProperty`]: ({ dataObject, dataIn, dataOut }) => {
        debugger
        // for (const [key, val] of u.entries(obj)) {
        //   if (keyProp === key) {
        //     obj[key] = val
        //   } else {
        //     obj[key] = value
        //   }
        // }
        // return obj
      },
    }),
    [ctx],
  )

  return builtIns
}

export default useBuiltInFns
