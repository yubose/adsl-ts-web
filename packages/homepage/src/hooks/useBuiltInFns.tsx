import * as u from '@jsmanifest/utils'
import React from 'react'
import get from 'lodash/get'
import useCtx from '@/useCtx'

function useBuiltInFns() {
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
      [`=.builtIn.object.setProperty`]: ({ dataObject, dataIn, dataOut }) => {},
    }),
    [ctx],
  )

  return builtIns
}

export default useBuiltInFns
