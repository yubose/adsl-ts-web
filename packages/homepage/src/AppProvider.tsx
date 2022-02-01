import React from 'react'
import * as u from '@jsmanifest/utils'
import * as t from '@/types'
import useGetNoodlPages from '@/hooks/useGetNoodlPages'
import useRootObject from '@/hooks/useRootObject'
import { Provider } from '@/useCtx'
import log from '@/utils/log'

log.setLevel('DEBUG')

export type AppState = typeof initialState

export const initialState = {
  pages: {},
}

function AppProvider({ children }: React.PropsWithChildren<any>) {
  const { allNoodlPage: noodlPages } = useGetNoodlPages()

  const initialRootValue = React.useMemo(
    () =>
      u.reduce(
        noodlPages?.nodes || [],
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
    [],
  )

  const { root, getInRoot, setInRoot } = useRootObject({
    root: initialRootValue,
  })

  const [state, _setState] = React.useState(() => {
    /**
     * This is run during build time so we have can use this data to generate
     * the content for the rest of the pages
     */
    return { ...initialState, pages: initialRootValue }
  })

  React.useEffect(() => {
    window['log'] = log
  }, [])

  const ctx: t.AppContext = {
    ...state,
    root,
    setInRoot,
    getInRoot,
  }

  React.useEffect(() => {
    log.debug(`[AppProvider] Location: ${location.pathname}`, location.search)
    window['getInRoot'] = getInRoot
    window['state'] = state
  }, [])

  React.useEffect(() => {
    log.debug(`[AppProvider] AppState`, state)
  }, [state])

  return <Provider value={ctx}>{children}</Provider>
}

export default AppProvider
