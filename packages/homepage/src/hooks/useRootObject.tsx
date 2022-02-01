import * as u from '@jsmanifest/utils'
import React from 'react'
import produce, { Draft } from 'immer'
import merge from 'lodash/merge'
import get from 'lodash/get'
import has from 'lodash/has'
import { trimReference } from 'noodl-utils'
import is from '@/utils/is'
import log from '@/utils/log'

function useRootObject<Root extends Record<string, any>>(
  initialState = { root: {} as Root },
) {
  const [state, _setState] = React.useState(initialState)

  const setState = React.useCallback(
    (
      stateOrSetter:
        | ((draft: Draft<typeof initialState>) => void)
        | Partial<typeof initialState>,
    ) => {
      _setState(
        produce((draft: Draft<typeof initialState>) => {
          if (u.isFnc(stateOrSetter)) {
            stateOrSetter(draft)
          } else {
            merge(draft, stateOrSetter)
          }
        }),
      )
    },
    [state],
  )

  const getInRoot = React.useCallback(
    (key = '', pageName = '') => {
      if (u.isStr(key)) {
        let result: any
        pageName =
          pageName ||
          (typeof window !== 'undefined'
            ? location.pathname.replace(/\//g, '')
            : 'HomePage')

        if (is.reference(key)) {
          const path = trimReference(key)
          const paths = path.split('.')

          const dataObject = is.localReference(path)
            ? state.root[pageName]
            : state.root

          if (!has(dataObject, paths)) {
            log.error(
              `%cThe path "${paths.join(
                '.',
              )}" does not exist in the root object`,
              `color:#ec0000;`,
              state.root,
            )
          }

          result = get(dataObject, paths)
        } else {
          const paths = key.includes('.') ? key.split('.') : [key]
          result = has(state.root, paths)
            ? get(state.root, paths)
            : get(state.root[pageName], paths)
        }
        log.debug(`[AppProvider] Get "${key}" result`, result)
        return result
      }
    },
    [state],
  )

  return {
    ...state,
    getInRoot,
    setInRoot: setState,
  }
}

export default useRootObject
