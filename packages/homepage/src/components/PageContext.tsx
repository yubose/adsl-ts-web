import React from 'react'
import createCtx from '@/utils/createCtx'
import useContextLists from '@/hooks/useContextLists'
import * as t from '@/types'

const [usePageCtx, Provider] = createCtx<t.PageContext>()

export interface PageContextProps
  extends Pick<
    t.PageContext,
    'assetsUrl' | 'baseUrl' | 'lists' | 'name' | 'components' | 'refs' | 'slug'
  > {}

function PageContext({
  assetsUrl,
  baseUrl,
  children,
  lists: listsMap,
  name,
  components,
  refs,
  slug,
}: React.PropsWithChildren<PageContextProps>) {
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
    getCtxObject,
    getDataObject,
    getId,
    getIteratorVar,
    getListObject,
    isCtxObj,
    isListConsumer,
    lists,
    name,
    components,
    refs,
    slug,
  }

  return <Provider value={ctx}>{children}</Provider>
}

export { usePageCtx }

export default PageContext
