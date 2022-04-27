import React from 'react'
import * as u from '@jsmanifest/utils'
import createCtx from '@/utils/createCtx'
import deref from '@/utils/deref'
import is from '@/utils/is'
import log from '@/utils/log'
import useCtx from '@/useCtx'
import * as t from '@/types'

const [usePageCtx, Provider] = createCtx<t.PageContext>()

export interface PageContextProps
  extends Pick<
    t.PageContext,
    'lists' | 'pageName' | 'pageObject' | 'refs' | 'slug'
  > {}

function createCtxListsFn(
  fn: (
    ctxLists: t.PageContextListContextObject[],
    idOrComp: string | t.StaticComponentObject,
    opts?: { pageName: string; root: Record<string, any> },
  ) => any,
): typeof fn {
  return (ctxLists, idOrComp, opts) => {
    return fn(ctxLists, idOrComp, opts)
  }
}

function getId(idOrComp: string | t.StaticComponentObject) {
  return u.isStr(idOrComp) ? idOrComp : idOrComp?.id || ''
}

const getIteratorVar = createCtxListsFn((ctxLists, idOrComp) => {
  if (
    u.isObj(idOrComp) &&
    is.component.list(idOrComp) &&
    idOrComp.iteratorVar
  ) {
    return idOrComp.iteratorVar
  }
  const id = getId(idOrComp)
  const obj = ctxLists.find((obj) => isCtxListObj(obj, id))
  return obj?.iteratorVar || ''
})

const getListsCtxObject = createCtxListsFn((ctxLists, idOrComp) => {
  const id = getId(idOrComp)
  return id ? ctxLists.find((obj) => isCtxListObj(obj, id)) : null
})

const getListObject = createCtxListsFn((ctxLists, idOrComp, opts) => {
  let ctxObj = getListsCtxObject(ctxLists, idOrComp)
  let listObject = ctxObj?.listObject || null

  if (u.isStr(listObject)) {
    if (is.reference(listObject)) {
      listObject = deref({
        root: opts.root,
        ref: listObject,
        rootKey: opts.pageName,
      })
    }
  }
  if (!u.isArr(listObject)) {
    log.error(`getListObject returned a non-array`, {
      listObject,
      idOrComp,
      ...opts,
    })
  }
  return listObject
})

function isCtxListObj(
  obj: t.PageContextListContextObject,
  idOrComp: string | t.StaticComponentObject,
) {
  const id = getId(idOrComp)
  return (
    !!id &&
    (obj.id === id || u.array(obj.children).some((ids) => ids.includes(id)))
  )
}

const isListConsumer = createCtxListsFn((ctxLists, idOrComp) =>
  ctxLists.some((obj) => isCtxListObj(obj, getId(idOrComp))),
)

function PageContext({
  children,
  lists,
  pageName,
  pageObject,
  refs,
  slug,
}: React.PropsWithChildren<PageContextProps>) {
  const { root } = useCtx()
  const ctxLists = React.useMemo(() => u.values(lists), [lists])

  const getListDataObject = React.useCallback(
    (idOrComp: string | t.StaticComponentObject) => {
      const id = getId(idOrComp)
      const ctxListObj = getListsCtxObject(ctxLists, idOrComp, {
        pageName,
        root,
      })
      const listObject = getListObject(ctxLists, id, { pageName, root })
      const index = ctxListObj.children.findIndex((ids) => ids.includes(id))

      if (listObject) {
        log.debug(`[PageContext] Retrieved listObject`, listObject)
        log.debug(`[PageContext] Index: ${index}`)
        const dataObject = listObject[index]
        log.debug(`[PageContext] Returning dataObject`, dataObject)
        return dataObject
      }

      return null
    },
    [ctxLists, lists, pageName, root],
  )

  const ctx: t.PageContext = React.useMemo(
    () => ({
      getIteratorVar: (...args) => getIteratorVar(ctxLists, ...args),
      getListsCtxObject: (...args) => getListsCtxObject(ctxLists, ...args),
      getListObject: (id, opts) =>
        getListObject(ctxLists, id, { root, pageName, ...opts }),
      getListDataObject: (...args) => getListDataObject(...args),
      isListConsumer: (...args) => isListConsumer(ctxLists, ...args),
      lists,
      pageName,
      pageObject,
      refs,
      slug,
    }),
    [ctxLists, lists, pageName, pageObject],
  )

  return <Provider value={ctx}>{children}</Provider>
}

export { usePageCtx }

export default PageContext
