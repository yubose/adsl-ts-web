import React from 'react'
import * as u from '@jsmanifest/utils'
import * as t from '@/types'
import useGetNoodlPages from '@/hooks/useGetNoodlPages'
import useRootObject from '@/hooks/useRootObject'
import { Provider } from '@/useCtx'
import log from '@/utils/log'

log.setLevel('DEBUG')

function AppProvider({
  children,
  initialRoot,
}: React.PropsWithChildren<{ initialRoot?: Record<string, any> }>) {
  const noodlPages = useGetNoodlPages()

  const { root, getInRoot, setInRoot } = useRootObject(
    initialRoot ||
      u.reduce(
        noodlPages?.nodes || [],
        (acc, node) => {
          if (!node) return acc
          try {
            /**
             * To ensure our app stays performant and minimal as possible we
             * can remove the components from each page in the state here.
             * Components are instead directly passed to each NoodlPageTemplate
             * in props.pageContext so they manage their own components in a
             * lower level
             */
            acc[node.name] = u.omit(JSON.parse(node.content), ['components'])
          } catch (error) {
            log.error(error instanceof Error ? error : new Error(String(error)))
          }

          return acc
        },
        {},
      ),
  )

  const ctx: t.AppContext = React.useMemo(
    () => ({
      root,
      setInRoot,
      getInRoot,
      // NOTE: This is purposely (temporarily) not being received results due to static images having errors in production. Images fall back to loading images normally if static images aren't available (see createRenderer.tsx)
      // images: (staticImages?.edges || []).reduce((acc, { node } = {}) => {
      //   if (!node?.childImageSharp?.gatsbyImageData) return acc
      //   acc[node.base] = {
      //     data: node.childImageSharp.gatsbyImageData,
      //     filename: node.base,
      //     url: node.publicURL,
      //   }
      //   return acc
      // }, {} as t.AppContext['images']),
    }),
    [root],
  )

  React.useEffect(() => {
    log.debug(`[AppProvider] Location: ${location.pathname}`, location.search)
    window['getInRoot'] = getInRoot
    window['log'] = log
    window['root'] = ctx.root
  }, [])

  return <Provider value={ctx}>{children}</Provider>
}

export default AppProvider
