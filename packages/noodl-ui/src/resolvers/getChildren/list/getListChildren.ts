import _ from 'lodash'
import Logger from 'logsnap'
import {
  IComponent,
  Resolver,
  ResolverConsumerOptions,
  ResolverOptions,
} from '../../../types'
import { identify } from '../../../utils/noodl'
import getChildProps from '../getChildProps'
import getListItemBlueprint from './getListItemBlueprint'

const log = Logger.create('getListChildren')

/**
 * List components render their children by mapping through its "listObject"
 * So we must provide a custom implementation that mimics regular rendering behavior
 * for each item in the list the NOODL data only gives us the blueprint to render its children
 */
const getListChildren: Resolver = (
  component: IComponent,
  options: ResolverConsumerOptions & { resolverOptions: ResolverOptions },
) => {
  const {
    context: { page },
    resolveComponent,
    getList,
    getListItem,
    setConsumerData,
    setList,
    resolverOptions,
  } = options

  const listObject = component.get('listObject')

  // Ensure it is iterable
  let listObjects: any[] = _.isArray(listObject) ? listObject : [listObject]
  // (Children will be able to retrieve data by referring to this list data using the
  // component id as "listId"
  let listId: string = component.id || ''
  // component.iteratorVar is used to attach it as the data item for list item components
  let iteratorProp = component.get('iteratorVar') || ''
  let rawBlueprint: any
  let parsedBlueprint: any

  // Hard code some of this stuff for now until we figure out a better solution
  if (identify.stream.video.isSubStream(component)) {
    const filterer = (f: any) => !!f?.sid
    if (!page.object?.listData) {
      log.red(`listData was undefined. No participants can be queried`, page)
    }
    listObjects = _.filter(page.object?.listData?.participants || [], filterer)
  }

  setList(listId, listObjects)

  rawBlueprint = getListItemBlueprint({
    component,
    getList,
    listId,
  })

  if (_.isObjectLike(rawBlueprint)) {
    /**
     * TODO - This will emit a false error in the console stating that some expected
     * data was null or undefined. Create some copy-cat resolveComponent utility
     * that silences the debug messages
     */
    parsedBlueprint = resolveComponent(rawBlueprint, resolverOptions)
  } else {
    log.red(`Could not generate a blueprint for a list`, {
      snapshot: component.snapshot(),
      rawBlueprint,
    })
  }

  component.set('blueprint', parsedBlueprint)

  _.forEach(listObjects, (listItem, listItemIndex) => {
    if (listItem) {
      const mergingProps = {
        blueprint: parsedBlueprint,
        iteratorVar: iteratorProp,
        listId,
        listItemIndex,
      }

      if (iteratorProp) {
        mergingProps[String(iteratorProp)] = listItem
      } else {
        log.red(
          `The "iteratorVar" prop is invalid. Children of this component ` +
            `will not be able to retrieve this data as a result`,
          {
            snapshot: component.snapshot(),
            listId,
            listItems: getList(listId),
            listItem: getListItem(listId, listItemIndex),
            listItemIndex,
          },
        )
      }

      const listItemComponent = getChildProps(
        component,
        rawBlueprint,
        listItemIndex,
        mergingProps,
      )

      setConsumerData(listItemComponent?.id || '', listItem)

      const result = resolveComponent?.(
        listItemComponent,
        resolverOptions,
      ) as IComponent

      // Direct children (listItem components) will consume this list data
      // during the resolving process
      component.createChild(result)
    } else {
      log.red(
        `Tried to create a child for a list component but received an ` +
          `invalid "listObject"`,
        {
          snapshot: component.snapshot(),
          listId,
          listData: getList(listId),
          listItem: getListItem(listId, listItemIndex),
          listItemIndex,
        },
      )
    }
  })
}

export default getListChildren
