import React from 'react'
import * as u from '@jsmanifest/utils'
import * as t from '@/types'
import useGetNoodlPages from '@/hooks/useGetNoodlPages'
import useRootObject from '@/hooks/useRootObject'
import useStaticImages from '@/hooks/useStaticImages'
import { Provider } from '@/useCtx'
import log from '@/utils/log'

log.setLevel('DEBUG')

function AppProvider({
  children,
  initialRoot,
}: React.PropsWithChildren<{ initialRoot?: Record<string, any> }>) {
  const noodlPages = useGetNoodlPages()
  const staticImages = useStaticImages()

  const { root, getInRoot, setInRoot } = useRootObject(
    initialRoot ||
      u.reduce(
        noodlPages?.nodes || [],
        (acc, node) => {
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
      images: staticImages.nodes.reduce((acc, node) => {
        if (!node?.childImageSharp?.gatsbyImageData) return acc
        acc[node.base] = {
          data: node.childImageSharp.gatsbyImageData,
          id: node.id,
        }
        return acc
      }, {}),
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
