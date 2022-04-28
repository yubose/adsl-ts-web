import React from 'react'
import * as u from '@jsmanifest/utils'
import * as t from '@/types'

function useDebugFns() {
  const peekValuesWithKeys = React.useCallback(
    (
      keys: string | string[],
      components: t.StaticComponentObject | t.StaticComponentObject[],
    ) => {
      const regex = new RegExp(u.array(keys).join('|'), 'ig')
      const values = [] as any[]

      for (const component of u.array(components)) {
        while (component) {
          if (u.isArr(components)) {
            //
          } else if (u.isObj(components)) {
            for (const [key, value] of u.entries(components)) {
              if (regex.test(key)) {
                //
              }
            }
          } else {
            //
          }
        }
      }

      return values
    },
    [],
  )

  return {
    peekValuesWithKeys,
  }
}

export default useDebugFns
