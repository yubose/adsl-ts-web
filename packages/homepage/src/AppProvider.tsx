import React from 'react'
import * as u from '@jsmanifest/utils'
import { useStaticQuery } from 'gatsby'
import { trimReference } from 'noodl-utils'
import lodashGet from 'lodash/get'
import has from 'lodash/has'
import merge from 'lodash/merge'
import produce, { Draft } from 'immer'
import * as t from '@/types'
import is from '@/utils/is'
import useGetNoodlPages from '@/hooks/useGetNoodlPages'
import { Provider } from './useCtx'

export type AppState = typeof initialState

export const initialState = {
  pages: {},
}

function AppProvider({ children }: React.PropsWithChildren<any>) {
  const { allNoodlPage: noodlPages } = useGetNoodlPages()
  const [state, _setState] = React.useState(() => {
    return {
      ...initialState,
      pages: u.reduce(
        noodlPages.nodes,
        (acc, node) => {
          try {
            acc[node.name] = JSON.parse(node.content)
          } catch (error) {
            console.error(
              error instanceof Error ? error : new Error(String(error)),
            )
          }

          return acc
        },
        {},
      ),
    }
  })

  const setState = React.useCallback(
    (stateOrSetter: Partial<AppState> | ((draft: Draft<AppState>) => void)) => {
      _setState(
        produce((draft) => {
          if (u.isFnc(stateOrSetter)) {
            stateOrSetter(draft)
          } else if (u.isObj(stateOrSetter)) {
            merge(draft, stateOrSetter)
          }
        }),
      )
    },
    [],
  )

  const get = React.useCallback(
    (key = '') => {
      if (u.isStr(key)) {
        let result: any
        let pageName =
          typeof window !== 'undefined'
            ? location.pathname.replace('/', '')
            : 'HomePage'

        if (is.reference(key)) {
          const path = trimReference(key)
          const paths = path.split('.')

          if (is.localReference(path)) {
            result = lodashGet(state.pages[pageName], paths)
          } else {
            result = lodashGet(state.pages, paths)
          }
          result = lodashGet(
            is.localReference(path) ? state.pages[pageName] : state.pages,
            paths,
          )
        } else {
          const paths = key.includes('.') ? key.split('.') : [key]
          result = has(state.pages, paths)
            ? lodashGet(state.pages, paths)
            : lodashGet(state.pages[pageName], paths)
        }
        console.log(`[AppProvider] Get "${key}" result`, result)
        return result
      }
    },
    [state.pages],
  )

  const ctx: t.AppContext = {
    ...state,
    set: setState,
    get,
  }

  React.useEffect(() => {
    console.log(`[AppProvider] Location: ${location.pathname}`, location.search)
    window['get'] = get
    window['state'] = state
  }, [])

  React.useEffect(() => {
    console.log(`[AppProvider] AppState`, state)
  }, [state])

  React.useEffect(() => {
    console.log(`[AppProvider] Noodl pages`, noodlPages)
  }, [noodlPages])

  return <Provider value={ctx}>{children}</Provider>
}

export default AppProvider
