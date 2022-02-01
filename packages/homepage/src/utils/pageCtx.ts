import * as u from '@jsmanifest/utils'
import * as t from '@/types'

export type GetListDataObjectInclude = 'id' | 'iteratorVar' | 'path'

export function getListDataObject<I extends GetListDataObjectInclude>(
  lists: t.PageContext['_context_']['lists'],
  component: t.StaticComponentObject | string,
  options?: {
    getInRoot?: any
    include?: GetListDataObjectInclude[]
    pageName?: string
    root?: Record<string, any>
    setInRoot?: any
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
    getInRoot?: any
    include?: GetListDataObjectInclude[]
    pageName?: string
    root?: Record<string, any>
    setInRoot?: any
  },
) {
  const id = (u.isObj(component) ? component.id : component) as string

  if (id) {
    if (u.isObj(lists)) {
      if (lists[id]) {
        if (lists[id].listObjectPath) {
          return options?.getInRoot?.(lists[id].listObjectPath)
        }
        // Fall back to a cloned copy
        return lists[id].listObject
      }

      for (const [_id, obj] of u.entries(lists || {})) {
        let numChildren = obj.children?.length || 0

        for (let index = 0; index < numChildren; index++) {
          const ids = obj.children[index] || []

          if (ids.includes(id)) {
            let dataObject: any

            // List data was initially given as a reference.
            // We must use the object in this path to keep the reference
            if (obj.listObjectPath) {
              dataObject = options.getInRoot(obj.listObjectPath)?.[index]
              debugger
            }
            // Fallback to the cloned copy
            if (!dataObject) dataObject = obj.listObject[index]

            if (options?.include) {
              return { dataObject, ...u.pick(obj, options.include) }
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
