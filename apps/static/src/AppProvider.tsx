import React from 'react'
import * as u from '@jsmanifest/utils'
import * as t from '@/types'
import { ToastContainer } from 'react-toastify'
import { Provider } from '@/useCtx'
import get from 'lodash/get'
import toast from '@/utils/toast'
import useDebugFns from '@/hooks/useDebugFns'
import useGetNoodlPages from '@/hooks/useGetNoodlPages'
import useRootObject from '@/hooks/useRootObject'
import log from '@/utils/log'

log.setLevel('DEBUG')

function AppProvider({ children }: React.PropsWithChildren<any>) {
  useDebugFns()
  const noodlPages = useGetNoodlPages()

  const { root, getR, setR } = useRootObject(
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
          acc[node.name] = u.omit(JSON.parse(node.content), 'components')
          return acc
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
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
  }

  React.useEffect(() => {
    window['getR'] = getR
    window['root'] = ctx.root
    window['get'] = get
  }, [ctx])

  return (
    <>
      <Provider value={ctx}>{children}</Provider>
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
