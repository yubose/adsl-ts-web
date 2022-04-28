import React from 'react'
import createCtx from '@/utils/createCtx'
import useContextLists from '@/hooks/useContextLists'
import * as t from '@/types'

const [usePageCtx, Provider] = createCtx<t.PageContext>()

export interface PageContextProps
  extends Pick<
    t.PageContext,
    | 'assetsUrl'
    | 'baseUrl'
    | 'lists'
    | 'pageName'
    | 'pageObject'
    | 'refs'
    | 'slug'
  > {}

function PageContext({
  assetsUrl,
  baseUrl,
  children,
  lists: listsMap,
  pageName,
  pageObject,
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
    pageName,
    pageObject,
    refs,
    slug,
  }

  return <Provider value={ctx}>{children}</Provider>
}

export { usePageCtx }

export default PageContext
