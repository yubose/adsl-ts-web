import React from 'react'
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

  const builtIns = {
    [`=.builtIn.string.equal`]: React.useCallback(
      (string1 = '', string2 = '') => {
        //
      },
      [],
    ),
    [`=.builtIn.object.setProperty`]: React.useCallback(
      (obj, keyProp, value) => {
        for (const [key, val] of u.entries(obj)) {
          if (keyProp === key) {
            obj[key] = val
          } else {
            obj[key] = value
          }
        }
        return obj
      },
      [],
    ),
  }

  return builtIns
}

export default useBuiltInFns
