import _ from 'lodash'
import { IListComponent, IListItemComponent, ResolverFn } from '../../types'
import Logger from 'logsnap'

const log = Logger.create('handleList')

const handleList: ResolverFn = (component, options) => {
  const { resolveComponent } = options
  const listComponent = component as IListComponent

  listComponent.on('blueprint', (args) => {
    const {
      baseBlueprint,
      currentBlueprint,
      iteratorVar,
      listObject,
      nodes,
      raw,
      update,
    } = args

    const newBlueprint = { eh: 'eh?', ...baseBlueprint, ...currentBlueprint }
    log.func('handleList --> on("blueprint")', args)
    // log.grey(`Updating blueprint`, { args, newBlueprint })
    // update(newBlueprint)
  })

  listComponent.on('data', (args) => {
    log.func('handleList --> on("data")')
    log.grey(`Data received an update`, { args })
  })

  const data = listComponent.getData()

  if (_.isArray(data)) {
    _.forEach(data, (dataObject) => {
      const child = resolveComponent(
        listComponent.createChild('listItem'),
      ) as IListItemComponent
      child.set(listComponent.iteratorVar, dataObject)
    })
  }
}

export default handleList
