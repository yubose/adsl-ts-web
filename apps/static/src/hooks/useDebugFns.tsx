import React from 'react'
import {
  findByClassName,
  findByDataAttrib,
  findByDataKey,
  findByElementId,
  findBySelector,
  findBySrc,
  findByViewTag,
  findByGlobalId,
} from 'noodl-ui'
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

  React.useEffect(() => {
    window['findByClassName'] = findByClassName
    window['findByDataAttrib'] = findByDataAttrib
    window['findByDataKey'] = findByDataKey
    window['findByElementId'] = findByElementId
    window['findBySelector'] = findBySelector
    window['findBySrc'] = findBySrc
    window['findByViewTag'] = findByViewTag
    window['findByGlobalId'] = findByGlobalId
  }, [])

  return {
    peekValuesWithKeys,
  }
}

export default useDebugFns
