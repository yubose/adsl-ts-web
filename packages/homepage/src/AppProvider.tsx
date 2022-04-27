import React from 'react'
import * as u from '@jsmanifest/utils'
import * as t from '@/types'
import { ToastContainer } from 'react-toastify'
import { RootObjectProvider } from '@/useRootObjectCtx'
import { Provider } from '@/useCtx'
import get from 'lodash/get'
import toast from '@/utils/toast'
import useGetNoodlPages from '@/hooks/useGetNoodlPages'
import useRootObject from '@/hooks/useRootObject'
import useStaticImages from '@/hooks/useStaticImages'
import log from '@/utils/log'

log.setLevel('DEBUG')

function AppProvider({
  children,
  initialRoot,
}: React.PropsWithChildren<{ initialRoot?: Record<string, any> }>) {
  const noodlPages = useGetNoodlPages()
  const staticImages = useStaticImages()

  const { root, getR, setR } = useRootObject(
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
            return acc
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error))
            console.error(err)
            toast(err)
          }
        },
        {},
      ),
  )

  const ctx: t.AppContext = {
    root,
    getR,
    setR,
    // images: (staticImages?.edges || []).reduce((acc, { node } = {}) => {
    //   if (!node?.childImageSharp?.gatsbyImageData) return acc
    //   acc[node.base] = {
    //     data: node.childImageSharp.gatsbyImageData,
    //     filename: node.base,
    //     url: node.publicURL,
    //   }
    //   return acc
    // }, {} as t.AppContext['images']),
  }

  React.useEffect(() => {
    log.debug(`[AppProvider] Location: ${location.pathname}`, location.search)
    window['getR'] = getR
    window['root'] = ctx.root
    window['get'] = get
    console.log({ staticImages })
    console.log(ctx)
  }, [ctx])

  console.log(`[AppProvider] Update`, root.AiTmedContact?.flag)

  return (
    <>
      <Provider value={ctx}>
        <RootObjectProvider value={root}>{children}</RootObjectProvider>
      </Provider>
      <ToastContainer
        autoClose={5000}
        hideProgressBar={false}
        position="bottom-right"
        rtl={false}
        closeOnClick
        draggable
        pauseOnFocusLoss
        pauseOnHover
        newestOnTop
      />
    </>
  )
}

export default AppProvider
