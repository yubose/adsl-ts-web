import type { LiteralUnion } from 'type-fest'
import * as u from '@jsmanifest/utils'
import * as t from '@/types'

export type GetListDataObjectInclude = 'id' | 'iteratorVar' | 'path'

export function getListDataObject<I extends GetListDataObjectInclude>(
  lists: t.PageContext['_context_']['lists'],
  component: t.StaticComponentObject | string,
  options?: {
    include?: GetListDataObjectInclude[]
  },
): {
  dataObject: any
} & Record<I, any>

export function getListDataObject(
  lists: t.PageContext['_context_']['lists'],
  component: t.StaticComponentObject | string,
): any

export function getListDataObject(
  lists: t.PageContext['_context_']['lists'],
  component: t.StaticComponentObject | string,
  options?: {
    include?: GetListDataObjectInclude[]
  },
) {
  const id = (u.isObj(component) ? component.id : component) as string

  if (id) {
    if (u.isObj(lists)) {
      if (lists[id]) return lists[id].listObject

      for (const [_id, _ctx] of u.entries(lists || {})) {
        let numChildren = _ctx.children.length

        for (let index = 0; index < numChildren; index++) {
          const ids = _ctx.children[index]
          if (ids.includes(id)) {
            const dataObject = _ctx.listObject[index]
            if (options?.include) {
              return {
                dataObject,
                ...u.pick(_ctx, options.include),
              }
            }
            return dataObject
          }
        }
      }
    } else {
      // TODO
    }
  } else {
    // TODO
  }
}
