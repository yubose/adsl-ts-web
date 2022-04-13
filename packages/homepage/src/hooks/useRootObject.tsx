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
  initialState = {} as Root,
) {
  const [root, setRoot] = React.useState(initialState)

  const setInRoot = React.useCallback(
    (
      stateOrSetter:
        | ((draft: Draft<typeof initialState>) => void)
        | Partial<typeof initialState>,
    ) => {
      setRoot(
        produce((draft) => {
          if (u.isFnc(stateOrSetter)) {
            stateOrSetter(draft)
          } else {
            merge(draft, stateOrSetter)
          }
        }),
      )
    },
    [root],
  )

  const getInRoot = React.useCallback(
    (
      keyOrRoot: string | Draft<Root> | Root,
      keyOrPageName = '',
      pageName = '',
    ) => {
      let _root: Root
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
          (typeof window !== 'undefined'
            ? location.pathname.replace(/\//g, '')
            : 'HomePage')

        if (is.reference(_key)) {
          const path = trimReference(_key)
          const paths = path.split('.')

          const dataObject = is.localReference(_key) ? _root[_pageName] : _root

          if (!has(dataObject, paths)) {
            log.error(
              `%cThe path "${paths.join(
                '.',
              )}" does not exist in the root object`,
              `color:#ec0000;`,
              _root,
            )
          }

          result = get(dataObject, paths)
        } else {
          const paths = _key.includes('.') ? _key.split('.') : [_key]
          result = has(_root, paths)
            ? get(_root, paths)
            : get(_root[_pageName], paths)
        }
        log.debug(`[AppProvider] Get "${_key}" result`, result)
        return result
      }
    },
    [root],
  )

  return {
    root,
    getInRoot,
    setInRoot,
  }
}

export default useRootObject
