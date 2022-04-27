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

const getId = (idOrComp: string | t.StaticComponentObject) =>
  u.isStr(idOrComp) ? idOrComp : idOrComp?.id || ''

function PageContext({
  children,
  lists,
  pageName,
  pageObject,
  refs,
  slug,
}: React.PropsWithChildren<PageContextProps>) {
  const { root } = useCtx()
  const ctxLists = React.useMemo(
    () => u.values(lists || {}),
    [lists, pageObject],
  )

  const getListsCtxObject = React.useCallback(
    (idOrComponent: string | t.StaticComponentObject) => {
      const id = getId(idOrComponent)
      if (id) {
        for (const obj of ctxLists) {
          if (obj.id === id || obj.children.some((ids) => ids.includes(id))) {
            return obj
          }
        }
      }
      return null
    },
    [ctxLists, pageObject],
  )

  const getIteratorVar = React.useCallback(
    (idOrComponent: string | t.StaticComponentObject) => {
      const id = getId(idOrComponent)
      if (id) {
        for (const obj of ctxLists) {
          if (obj.id === id || obj.children.some((ids) => ids.includes(id))) {
            return obj.iteratorVar
          }
        }
      }
      return ''
    },
    [ctxLists, pageObject],
  )

  const getListObject = React.useCallback(
    (idOrComponent: string | t.StaticComponentObject) => {
      const id = getId(idOrComponent)
      if (id) {
        let listObject: string | any[] = ctxLists.find(
          (obj) =>
            obj.id === id || obj.children.some((ids) => ids.includes(id)),
        )?.listObject

        if (u.isStr(listObject)) {
          if (is.reference(listObject)) {
            listObject = deref({
              root,
              ref: listObject,
              rootKey: pageName,
            })
          }
        }

        if (!u.isArr(listObject)) {
          log.error(`getListObject returnd a non-array`, { id, listObject })
        }

        return listObject
      }
    },
    [ctxLists, pageObject, root],
  )

  const getListDataObject = React.useCallback(
    (componentOrId: string | t.StaticComponentObject) => {
      const id = getId(componentOrId)
      if (id) {
        const listObject = getListObject(id)
        const index = ctxLists.findIndex(
          (obj) =>
            obj.id === id || obj.children.some((ids) => ids.includes(id)),
        )
        if (listObject) {
          log.debug(`[PageContext] Retrieved listObject`, listObject)
          const dataObject = listObject[index]
          log.debug(`[PageContext] Returning dataObject`, dataObject)
          return dataObject
        }
      } else {
        // TODO
      }
    },
    [ctxLists, getListObject, pageName, pageObject, root],
  )

  const isListConsumer = React.useCallback(
    (idOrComponent: string | t.StaticComponentObject) => {
      if (u.isObj(lists) && idOrComponent) {
        const id = getId(idOrComponent)
        if (id) {
          if (id in lists) return true
          for (const obj of ctxLists) {
            if (u.isArr(obj.children)) {
              for (const ids of obj.children) {
                if (ids.includes(id)) return true
              }
            }
          }
        }
      }
      return false
    },
    [ctxLists, pageObject, lists],
  )

  const ctx: t.PageContext = {
    getIteratorVar,
    getListsCtxObject,
    getListObject,
    getListDataObject,
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
