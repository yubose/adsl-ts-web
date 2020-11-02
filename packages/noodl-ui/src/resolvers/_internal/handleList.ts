import _ from 'lodash'
import { IList, IListItem, ResolverFn } from '../../types'

const handleList: ResolverFn = (component, options) => {
  const { resolveComponent } = options
  const listComponent = component as IList

  const data = listComponent.getData()
}

export default handleList
