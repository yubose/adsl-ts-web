import * as u from '@jsmanifest/utils'
import { createEmitDataKey, trimReference } from 'noodl-utils'
import type { NUIActionChain, NUITrigger } from 'noodl-ui'
import type { EmitObjectFold } from 'noodl-types'
import { deref } from 'noodl-ui'
import React from 'react'
import get from 'lodash/get'
import useCtx from '@/useCtx'
import { usePageCtx } from '@/components/PageContext'
import log from '@/utils/log'
import is from '@/utils/is'
import * as t from '@/types'

interface CommonRenderComponentHelpers
  extends Pick<t.AppContext, 'root' | 'getR' | 'setR'> {
  name: string
}

export interface BuiltInFnProps {
  actionChain: NUIActionChain
  dataObject: any
  dataIn: Record<string, any>
  dataOut?: string
}

// Using for TypeScript to pick up the args
const createFn =
  (options: CommonRenderComponentHelpers, fn: (opts: BuiltInFnProps) => any) =>
  (opts: BuiltInFnProps) =>
    fn({ ...opts, dataIn: purgeDataIn({ ...options, ...opts }) })

function purgeDataIn({
  actionChain,
  getR,
  name: pageName,
  dataObject,
  dataIn,
}: Pick<CommonRenderComponentHelpers, 'getR' | 'name'> & BuiltInFnProps) {
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
      } else {
        // dataIn[key] = value
      }
    }
  }

  return dataIn
}

function getBuiltInFns(options: CommonRenderComponentHelpers) {
  const builtInFns = {
    [`=.builtIn.string.equal`]: ({ dataIn }: BuiltInFnProps) => {
      const str1 = String(dataIn?.string1)
      const str2 = String(dataIn?.string2)
      const isEqual = str1 === str2
      log.debug(
        `%c[=.builtIn] Comparing: ${str1 === '' ? "''" : `'${str1}'`} === ${
          str2 === '' ? "''" : `'${str2}'`
        }: ${isEqual}`,
        'color:rgb(98, 143, 42)',
      )
      return isEqual
    },
    // Branched from lvl3
    [`=.builtIn.object.setProperty`]: ({ dataIn }: BuiltInFnProps) => {
      const arr = u.array(dataIn.obj).filter(Boolean)
      const numItems = arr.length
      for (let index = 0; index < numItems; index++) {
        if (u.isArr(dataIn.arr)) {
          dataIn.arr.forEach((item, i) => {
            if (arr?.[index]?.[dataIn.label] === dataIn.text) {
              arr[index][item] = dataIn.valueArr[i]
            } else {
              arr[index][item] = dataIn.errorArr[i]
            }
          })
        } else {
          log.error(
            `Expected 'arr' in dataIn to be an array but it was ${typeof dataIn.arr}`,
          )
        }
      }
      return dataIn
    },
    ['=.builtIn.object.resolveEmit']: ({
      dataIn: {
        emit: { dataKey, actions },
        trigger,
      },
      dataObject,
      iteratorVar = '',
      root = {},
      rootKey = '',
    }: {
      dataIn: EmitObjectFold & { trigger: NUITrigger }
      dataObject: any
      iteratorVar?: string
      root?: Record<string, any>
      rootKey?: string
    }) => {
      dataKey = createEmitDataKey(dataKey, dataObject, { iteratorVar })
      const cond = is.reference(actions[0]?.if?.[0])
        ? deref({
            dataObject,
            iteratorVar,
            ref: actions[0]?.if?.[0],
            root,
            rootKey,
          })
        : actions[0]?.if?.[0]
      const result = cond ? actions[0]?.if?.[1] : actions[0]?.if?.[2]
      return is.reference(result)
        ? deref({ dataObject, iteratorVar, ref: result, root, rootKey })
        : result
    },
  }

  return u.entries(builtInFns).reduce((acc, [builtInFnName, builtInFn]) => {
    acc[builtInFnName] = createFn(options, builtInFn)
    return acc
  }, {} as typeof builtInFns)
}

function useBuiltInFns() {
  const ctx = useCtx()
  const pageCtx = usePageCtx()
  const builtIns = getBuiltInFns({ ...ctx, ...pageCtx })

  const handleBuiltInFn = React.useCallback(
    (key = '', args: BuiltInFnProps) => {
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
    [ctx, pageCtx],
  )

  return {
    builtIns,
    handleBuiltInFn,
  }
}

export default useBuiltInFns
