/**
 * NOT BEING USED
 */
import React from 'react'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import { deref } from 'noodl-ui'
import { usePageCtx } from '@/components/PageContext'
import is from '@/utils/is'
import useCtx from '@/useCtx'

function useTransformer() {
  const { root } = useCtx()
  const pctx = usePageCtx()

  const transform = React.useCallback(
    (value: unknown, opts?: { dataObject?: any; iteratorVar?: string }) => {
      const { dataObject, iteratorVar = '' } = opts || {}

      value = deref({
        ref: value,
        root,
        rootKey: pctx.name,
        ...opts,
      })

      if (is.folds.emit(value)) {
        let actions = value?.emit?.actions || []
        let dataKey = value?.emit?.dataKey

        if (u.isStr(dataKey) && is.reference(dataKey)) {
          dataKey = deref({
            dataObject,
            iteratorVar,
            ref: dataKey,
            root,
            rootKey: pctx.name,
          })
        }

        if (u.isObj(dataKey)) {
          for (const [key, val] of u.entries(dataKey)) {
            if (u.isStr(val)) {
              if (val.startsWith('$')) {
                //
              } else if (is.reference(val)) {
                //
              } else if (iteratorVar && val.startsWith(iteratorVar)) {
                //
              }
            }
          }
        }

        // debugger
      } else if (is.if(value)) {
        const [cond, valTruthy, valFalsy] = value.if || []

        // debugger
      }

      return value
    },
    [pctx.name, root],
  )

  return {
    transform,
  }
}

export default useTransformer
