import * as u from '@jsmanifest/utils'
import * as nu from 'noodl-utils'
import * as nt from 'noodl-types'
import * as c from './constants'
import * as t from './types'
import NUIPage from './Page'
import { findListDataObject, isListConsumer } from './utils/noodl'

export default function _getQueryObjects(
  opts: {
    component?: t.NuiComponent.Instance
    page?: NUIPage
    queries?: () => Record<string, any> | (() => Record<string, any>)[]
    listDataObject?: any
  } = {},
) {
  const queries = [] as any[]
  // Query for a list data object
  if (opts?.component) {
    if (isListConsumer(opts.component)) {
      const dataObject =
        opts?.listDataObject || findListDataObject(opts.component)
      if (dataObject) {
        queries.push(dataObject)
      } else {
        console.log(
          `%cCould not find a data object for a list consumer "${opts.component.type}" component`,
          `color:#ec0000;`,
          opts.component,
        )
      }
    }
  }
  // Page object
  opts?.page && queries.push(() => o.getRoot()[opts.page?.page || ''])
  // Root object
  queries.push(() => o.getRoot())
  opts?.queries && u.array(opts.queries).forEach((q) => queries.unshift(q))
  return queries
}
