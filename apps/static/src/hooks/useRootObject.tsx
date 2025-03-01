import * as u from '@jsmanifest/utils'
import React from 'react'
import get from 'lodash/get'
import has from 'lodash/has'
import { trimReference } from 'noodl-utils'
import is from '@/utils/is'
import log from '@/utils/log'
import { getCurrent, produce } from '@/utils/immer'
import type { Draft } from '@/utils/immer'
import { FALLBACK_PAGE_NAME } from '../constants'
import * as t from '@/types'

export interface UseRootObjectOptions<
  O extends Record<string, any> = Record<string, any>,
> {
  initialRoot?: Partial<t.RootObject<O>>
}

function useRootObject<O extends Record<string, any>>(
  initialRoot = {} as O & UseRootObjectOptions['initialRoot'],
) {
  const [root, setRoot] = React.useState<t.RootObject>({
    ...initialRoot,
    Global: { ...initialRoot?.Global },
  })

  const setR = React.useCallback(
    (
      stateOrSetter:
        | ((draft: Draft<typeof initialRoot>) => void)
        | Partial<typeof initialRoot>,
    ) => {
      setRoot(
        produce((draft) => {
          if (u.isFnc(stateOrSetter)) {
            stateOrSetter(draft)
          } else {
            u.entries(stateOrSetter).forEach(([k, v]) => (draft[k] = v))
          }
        }),
      )
    },
    [root, setRoot],
  )

  const getR = React.useCallback(
    (keyOrRoot: string | Draft<O> | O, keyOrPageName = '', pageName = '') => {
      let _root: O
      let _key = ''
      let _pageName = ''

      if (u.isObj(keyOrRoot)) {
        _root = keyOrRoot
        _key = keyOrPageName
        _pageName = pageName
      } else {
        _root = root
        _key = keyOrRoot
        _pageName = keyOrPageName
      }

      if (u.isStr(_key)) {
        let result: any

        _pageName =
          _pageName ||
          (u.isBrowser()
            ? location.pathname.replace(/\//g, '')
            : FALLBACK_PAGE_NAME)

        if (is.reference(_key)) {
          const path = trimReference(_key)
          const paths = path.split('.')
          const dataObject = is.localReference(_key) ? _root[_pageName] : _root

          if (!has(dataObject, paths)) {
            let logMsg = '%c'
            logMsg += `The path "${paths.join('.')}" `
            logMsg += `does not exist in the root object`
            log.error(logMsg, `color:#ec0000;`, _root)
          }

          result = get(dataObject, paths)
        } else {
          const paths = _key.includes('.') ? _key.split('.') : [_key]
          result = has(_root, paths)
            ? get(_root, paths)
            : get(_root[_pageName], paths)
        }
        log.debug(`[AppProvider] Get "${_key}" result`, getCurrent(result))
        return result
      }
    },
    [root],
  )

  return {
    root,
    getR,
    setR,
  }
}

export default useRootObject
