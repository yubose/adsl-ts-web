import * as u from '@jsmanifest/utils'
import { trimReference } from 'noodl-utils'
import type { NUIActionChain } from 'noodl-ui'
import produce, { isDraft, current as draftToCurrent } from 'immer'
import React from 'react'
import get from 'lodash/get'
import useCtx from '@/useCtx'
import { usePageCtx } from '@/components/PageContext'
import log from '@/utils/log'
import is from '@/utils/is'
import * as t from '@/types'

export interface BuiltInFnProps {
  actionChain: NUIActionChain
  dataObject: any
  dataIn: Record<string, any>
  dataOut?: string
}

// Using for TypeScript to pick up the args
const createFn =
  (
    options: t.CommonRenderComponentHelpers,
    fn: (opts: BuiltInFnProps) => any,
  ) =>
  (opts: BuiltInFnProps) =>
    fn({ ...opts, dataIn: purgeDataIn({ ...options, ...opts }) })

function purgeDataIn({
  actionChain,
  getR,
  pageName,
  dataObject,
  dataIn,
}: Pick<t.CommonRenderComponentHelpers, 'getR' | 'pageName'> & BuiltInFnProps) {
  for (const [key, value] of u.entries(dataIn)) {
    if (u.isStr(value)) {
      if (value.startsWith('$')) {
        const paths = value.split('.').slice(1)
        dataIn[key] = get(dataObject, paths)
      } else if (is.reference(value)) {
        let paths = []
        if (is.localReference(value)) pageName && paths.push(pageName)
        paths = paths.concat(trimReference(value).split('.'))

        dataIn[key] = getR(
          actionChain?.data?.get('rootDraft'),
          paths.join('.'),
          pageName,
        )
      }
    }
  }

  return dataIn
}

function getBuiltInFns(options: t.CommonRenderComponentHelpers) {
  const builtInFns = {
    [`=.builtIn.string.equal`]: ({ dataIn }: BuiltInFnProps) => {
      const str1 = String(dataIn?.string1 || '')
      const str2 = String(dataIn?.string2 || '')
      return str1 === str2
    },
    [`=.builtIn.object.setProperty`]: ({ dataIn }: BuiltInFnProps) => {
      const arr = u.array(dataIn.obj).filter(Boolean)
      const numItems = arr.length
      for (let index = 0; index < numItems; index++) {
        if (u.isArr(dataIn.arr)) {
          for (let i in dataIn.arr) {
            if (arr?.[index]?.[dataIn.label] === dataIn.text) {
              arr[index][arr[i]] = dataIn.valueArr[i]
            } else {
              arr[index][arr[i]] = dataIn.errorArr[i]
            }
          }
        } else {
          log.error(
            `Expected 'arr' in dataIn to be an array but it was ${typeof dataIn.arr}`,
          )
        }
      }
      return dataIn
    },
  }

  return u.reduce(
    u.entries(builtInFns),
    (acc, [builtInFnName, builtInFn]) => {
      acc[builtInFnName] = createFn(options, builtInFn)
      return acc
    },
    {} as typeof builtInFns,
  )
}

function useBuiltInFns() {
  const ctx = useCtx()
  const pageCtx = usePageCtx()

  const builtIns = React.useMemo(
    () =>
      getBuiltInFns({
        ...ctx,
        ...pageCtx,
      }),
    [ctx, pageCtx],
  )

  const handleBuiltInFn = React.useCallback(
    function _handleBuiltInFn(key = '', args: BuiltInFnProps) {
      const fn = builtIns[key]
      if (u.isFnc(fn)) {
        return fn(args)
      } else {
        log.error(
          `%cYou are missing the builtIn implementation for "${key}"`,
          `color:#ec0000;`,
        )
      }
    },
    [builtIns],
  )

  return {
    ...builtIns,
    handleBuiltInFn,
  }
}

export default useBuiltInFns
