import * as u from '@jsmanifest/utils'
import { trimReference } from 'noodl-utils'
import produce from 'immer'
import React from 'react'
import get from 'lodash/get'
import useCtx from '@/useCtx'
import usePageCtx from '@/usePageCtx'
import log from '@/utils/log'
import is from '@/utils/is'
import * as t from '@/types'

// Using for TypeScript to pick up the args
const createFn =
  <
    Args extends {
      dataObject: any
      dataIn: Record<string, any>
      dataOut?: string
    } = {
      dataObject: any
      dataIn: Record<string, any>
      dataOut?: string
    },
  >(
    fn: (opts: Args) => any,
  ) =>
  (opts: Args) =>
    fn(opts)

function getBuiltInFns({ pages: root, ...opts }: t.AppContext) {
  const builtIns = {
    [`=.builtIn.string.equal`]: createFn(({ dataIn }) => {
      const str1 = String(dataIn?.string1 || '')
      const str2 = String(dataIn?.string2 || '')
      return str1 === str2
    }),
    [`=.builtIn.object.setProperty`]: createFn(
      ({ dataObject, dataIn, dataOut }) => {
        // debugger
      },
    ),
  }

  return builtIns
}

function useBuiltInFns() {
  const ctx = useCtx()
  const pageCtx = usePageCtx()

  const handleBuiltInFn = React.useCallback((key = '', ...args: any[]) => {
    const fn = builtIns[key]
    if (u.isFnc(fn)) {
      return (fn as any)(...args)
    } else {
      log.error(
        `%cYou are missing the builtIn implementation for "${key}"`,
        `color:#ec0000;`,
      )
    }
  }, [])

  const builtIns = React.useMemo(
    () =>
      u.reduce(
        u.entries(getBuiltInFns({ ...ctx })),
        (acc, [key, fn]) => {
          acc[key] = function onBeforeBuiltInInvocation({
            dataObject,
            dataIn,
            ...rest
          }: Parameters<Parameters<typeof createFn>[0]>[0]) {
            if (u.isObj(dataIn) && u.isObj(dataObject)) {
              dataIn = produce(dataIn, (draft) => {
                for (const [key, value] of u.entries(draft)) {
                  if (u.isStr(value)) {
                    if (value.startsWith('$')) {
                      const paths = value.split('.').slice(1)
                      draft[key] = get(dataObject, paths)
                    } else if (is.reference(value)) {
                      let paths = []
                      if (is.localReference(value)) {
                        pageCtx.pageName && paths.push(pageCtx.pageName)
                      }
                      paths.push(...trimReference(value).split('.'))
                      draft[key] = ctx.get(paths.join('.'))
                    }
                  }
                }
              })
            }

            return fn({ dataObject, dataIn, ...rest })
          }
          return acc
        },
        {} as typeof getBuiltInFns,
      ),
    [ctx, pageCtx.pageName],
  )

  return {
    ...builtIns,
    handleBuiltInFn,
  }
}

export default useBuiltInFns
