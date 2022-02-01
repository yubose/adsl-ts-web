import React from 'react'
import * as u from '@jsmanifest/utils'
import { trimReference } from 'noodl-utils'
import lodashGet from 'lodash/get'
import has from 'lodash/has'
import merge from 'lodash/merge'
import produce, { Draft } from 'immer'
import * as t from '@/types'
import is from '@/utils/is'
import useGetNoodlPages from '@/hooks/useGetNoodlPages'
import { Provider } from '@/useCtx'
import log from '@/utils/log'

log.setLevel('DEBUG')

export type AppState = typeof initialState

export const initialState = {
  pages: {},
}

function AppProvider({ children }: React.PropsWithChildren<any>) {
  const { allNoodlPage: noodlPages } = useGetNoodlPages()
  const [state, _setState] = React.useState(() => {
    /**
     * This is run during build time so we have can use this data to generate the content for the rest of the pages
     */
    return {
      ...initialState,
      pages: u.reduce(
        noodlPages.nodes,
        (acc, node) => {
          try {
            /**
             * To ensure our app stays performant and minimal as possible we can remove the components from each page in the state here.
             * Components are instead directly passed to each NoodlPageTemplate in props.pageContext so they manage their own components in a lower level
             */
            acc[node.name] = u.omit(JSON.parse(node.content), ['components'])
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

  React.useEffect(() => {
    window['log'] = log
  }, [])

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
          const dataObject = is.localReference(path)
            ? state.pages[pageName]
            : state.pages

          if (!has(dataObject, paths)) {
            log.error(
              `%cThe path "${paths.join(
                '.',
              )}" does not exist in the root object`,
              `color:#ec0000;`,
              state.pages,
            )
          }

          result = lodashGet(dataObject, paths)
        } else {
          const paths = key.includes('.') ? key.split('.') : [key]
          result = has(state.pages, paths)
            ? lodashGet(state.pages, paths)
            : lodashGet(state.pages[pageName], paths)
        }
        log.debug(`[AppProvider] Get "${key}" result`, result)
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
    log.debug(`[AppProvider] Location: ${location.pathname}`, location.search)
    window['get'] = get
    window['state'] = state
  }, [])

  React.useEffect(() => {
    log.debug(`[AppProvider] AppState`, state)
  }, [state])

  React.useEffect(() => {
    log.debug(`[AppProvider] Noodl pages`, noodlPages)
  }, [noodlPages])

  return <Provider value={ctx}>{children}</Provider>
}

export default AppProvider
