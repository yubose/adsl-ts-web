import React from 'react'
import * as u from '@jsmanifest/utils'
import deref from '@/utils/deref'
import is from '@/utils/is'
import * as t from '@/types'

export type IdOrComponentArg = string | t.StaticComponentObject

function useContextLists(listsMap: t.PageContext['lists']) {
  const lists = React.useMemo(() => Object.values(listsMap || {}), [listsMap])

  const getId = React.useCallback((id: IdOrComponentArg): string => {
    return u.isStr(id) ? id : id?.id || ''
  }, [])

  const getIteratorVar = React.useCallback(
    (id: IdOrComponentArg) => {
      if (u.isObj(id) && is.component.list(id)) return id.iteratorVar
      id = getId(id)
      return lists.find((obj) => isCtxObj(obj, id))?.iteratorVar || ''
    },
    [getId, lists],
  )

  const getCtxObject = React.useCallback(
    (id: IdOrComponentArg) => {
      id = getId(id)
      return (
        id ? lists.find((obj) => isCtxObj(obj, id)) : null
      ) as t.PageContextListContextObject
    },
    [getId, lists],
  )

  const getListObject = React.useCallback(
    (id: IdOrComponentArg, root?: Record<string, any>, pageName?: string) => {
      let ctxObj = getCtxObject(id)
      let listObject = ctxObj?.listObject || null

      if (u.isStr(listObject)) {
        if (is.reference(listObject)) {
          listObject = deref({
            root,
            ref: listObject,
            rootKey: is.localReference(listObject) ? pageName : '',
          })
        }
      }

      return listObject
    },
    [getCtxObject, lists],
  )

  const getDataObject = React.useCallback(
    (id: IdOrComponentArg, root?: Record<string, any>, pageName?: string) => {
      id = getId(id)
      const listObj = getCtxObject(id)
      const listObject = getListObject(id, root, pageName)
      const index = listObj?.children?.findIndex((ids: string[]) =>
        ids.includes(id as string),
      )
      if (listObject) return listObject[index]
      return null
    },
    [getId, getCtxObject, getListObject],
  )

  const isCtxObj = React.useCallback(
    (obj: t.PageContextListContextObject, id: IdOrComponentArg) => {
      id = getId(id)
      return (
        !!id &&
        (obj.id === id ||
          u.array(obj.children).some((ids) => ids.includes(id as string)))
      )
    },
    [getId],
  )

  const isListConsumer = React.useCallback(
    (id: IdOrComponentArg) => lists.some((obj) => isCtxObj(obj, getId(id))),
    [getId, lists, isCtxObj],
  )

  return {
    lists,
    getId,
    getCtxObject,
    getListObject,
    getDataObject,
    getIteratorVar,
    isCtxObj,
    isListConsumer,
  }
}

export default useContextLists
