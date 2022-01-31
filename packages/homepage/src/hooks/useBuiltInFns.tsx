import * as u from '@jsmanifest/utils'
import { trimReference } from 'noodl-utils'
import produce, { Draft } from 'immer'
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

function purgeReferences(
  { ctx, pageName, dataObject, dataIn, dataOut, ...rest },
  fn?: any,
) {
  return produce(dataIn, (draft) => {
    for (const [key, value] of u.entries(draft)) {
      if (u.isStr(value)) {
        if (value.startsWith('$')) {
          const paths = value.split('.').slice(1)
          draft[key] = get(dataObject, paths)
        } else if (is.reference(value)) {
          const paths = []
          if (is.localReference(value)) {
            pageName && paths.push(pageName)
          }
          paths.push(...trimReference(value).split('.'))
          const result = ctx.get(paths.join('.'))
          draft[key] = result
        }
      }
    }

    fn?.({
      ...rest,
      dataObject: { ...dataObject },
      dataIn: draft,
    })
  })
}

function getBuiltInFns({ ctx, pageName, pages: root, ...opts }: t.AppContext) {
  const builtIns = {
    [`=.builtIn.string.equal`]: createFn(({ dataIn, ...rest }) => {
      dataIn = purgeReferences({ ctx, pageName, dataIn, ...rest })
      const str1 = String(dataIn?.string1 || '')
      const str2 = String(dataIn?.string2 || '')
      debugger
      return str1 === str2
    }),
    [`=.builtIn.object.setProperty`]: createFn(
      ({ dataObject, dataIn, dataOut }) => {
        ctx.set((draft) => {
          draft.pages.as = 'f'
          const _dataIn = draft.pages.Resource.baseHeaderData
          // const _dataIn = objs.dataIn
          const arr = u.array(_dataIn?.obj).filter(Boolean)
          const numItems = arr.length
          for (let index = 0; index < numItems; index++) {
            if (u.isArr(_dataIn.arr)) {
              for (let i in _dataIn.arr) {
                if (arr?.[index]?.[_dataIn.label] === _dataIn.text) {
                  arr[index][arr[i]] = _dataIn.valueArr[i]
                } else {
                  arr[index][arr[i]] = _dataIn.errorArr[i]
                }
              }
            } else {
              log.error(
                `Expected 'arr' in dataIn to be an array but it was ${typeof dataIn.arr}`,
              )
            }
          }
        })

        debugger
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
        u.entries(getBuiltInFns({ ctx, pageName: pageCtx.pageName })),
        (acc, [key, fn]) => {
          acc[key] = fn
          // acc[key] = function onBeforeBuiltInInvocation({
          //   dataObject,
          //   dataIn,
          //   ...rest
          // }: Parameters<Parameters<typeof createFn>[0]>[0]) {
          //   let result
          //   if (u.isObj(dataIn)) {
          //     // dataIn = produce(dataIn, (draft) => {
          //     //   for (const [key, value] of u.entries(draft)) {
          //     //     if (u.isStr(value)) {
          //     //       if (value.startsWith('$')) {
          //     //         const paths = value.split('.').slice(1)
          //     //         draft[key] = get(dataObject, paths)
          //     //       } else if (is.reference(value)) {
          //     //         const paths = []
          //     //         if (is.localReference(value)) {
          //     //           pageCtx.pageName && paths.push(pageCtx.pageName)
          //     //         }
          //     //         paths.push(...trimReference(value).split('.'))
          //     //         const result = ctx.get(paths.join('.'))
          //     //         draft[key] = result
          //     //       }
          //     //     }
          //     //   }

          //     //   result = fn({
          //     //     ...rest,
          //     //     dataObject: { ...dataObject },
          //     //     dataIn: draft,
          //     //   })
          //     // })
          //   }

          //   return result
          // }
          return acc
        },
        {} as typeof getBuiltInFns,
      ),
    [ctx.pages, pageCtx.pageName],
  )

  return {
    ...builtIns,
    handleBuiltInFn,
  }
}

export default useBuiltInFns
