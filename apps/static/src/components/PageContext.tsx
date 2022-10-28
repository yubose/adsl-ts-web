import React from 'react'
import createCtx from '@/utils/createCtx'
import useContextLists from '@/hooks/useContextLists'
import * as t from '@/types'

const [usePageCtx, Provider] = createCtx<t.PageContext>()

function PageContext({
  assetsUrl,
  baseUrl,
  children,
  lists: listsMap,
  name,
  components,
  paths,
  refs,
  slug,
}: React.PropsWithChildren<
  Pick<
    t.PageContext,
    'assetsUrl' | 'baseUrl' | 'components' | 'lists' | 'name' | 'refs' | 'slug'
  >
>) {
  const {
    getCtxObject,
    getDataObject,
    getId,
    getIteratorVar,
    getListObject,
    isCtxObj,
    isListConsumer,
    lists,
  } = useContextLists(listsMap)

  const ctx: t.PageContext = {
    assetsUrl,
    baseUrl,
    getId,
    getCtxObject,
    getIteratorVar,
    getListObject,
    getDataObject,
    isCtxObj,
    isListConsumer,
    lists,
    name,
    components,
    paths,
    refs,
    slug,
  }

  return <Provider value={ctx}>{children}</Provider>
}

export { usePageCtx }

export default PageContext
