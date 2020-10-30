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

  listComponent.on('create.list.item', (node, args) => {
    const { data, nodes } = args
    component.set('iteratorVar', listComponent.iteratorVar)
    component.set('listId', listComponent.listId)
    component.set(
      'listIndex',
      listComponent.length ? listComponent.length - 1 : 0,
    )
  })

  listComponent.on('data', (data, args) => {
    log.func('handleList --> on("data")')
    log.grey(`Data received an update`, { data, ...args })
    const { blueprint, nodes } = args
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
