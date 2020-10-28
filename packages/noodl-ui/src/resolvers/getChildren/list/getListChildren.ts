import _ from 'lodash'
import Logger from 'logsnap'
import {
  IComponent,
  ResolverFn,
  ConsumerOptions,
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
const getListChildren: ResolverFn = (
  component: IComponent,
  options: ConsumerOptions & { resolverOptions: ResolverOptions },
) => {
  const {
    context: { page },
    resolveComponent,
    resolverOptions,
  } = options

  const { listObject, iteratorVar = '' } = component.get([
    'listObject',
    'iteratorVar',
  ])
  // Ensure it is iterable
  let listObjects: any[] = _.isArray(listObject) ? listObject : [listObject]
  // component.iteratorVar is used to attach it as the data item for list item components
  let rawBlueprint: any
  let parsedBlueprint: any
  let listId = ''

  // Hard code some of this stuff for now until we figure out a better solution
  if (identify.stream.video.isSubStream(component.toJS())) {
    const filterer = (f: any) => !!f?.sid
    if (!page?.listData) {
      log.red(`listData was undefined. No participants can be queried`, page)
    }
    listObjects = _.filter(page?.listData?.participants || [], filterer)
  }

  setList(component, listObjects)

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

  const jsBlueprint = parsedBlueprint.toJS()

  component.set('blueprint', jsBlueprint)

  _.forEach(listObjects, (listItem, listItemIndex) => {
    if (listItem) {
      const mergingProps = {
        blueprint: jsBlueprint,
        iteratorVar: iteratorVar,
        listItem,
        listId,
        listItemIndex,
      }

      if (iteratorVar) {
        mergingProps[String(iteratorVar)] = listItem
      } else {
        log.red(
          `The "iteratorVar" prop is invalid. Children of this component ` +
            `will not be able to retrieve this data as a result`,
          {
            snapshot: component.snapshot(),
            listId,
            listItems: getList(listId),
            listItem: getListItem(component),
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
          listItem: getListItem(component),
          listItemIndex,
        },
      )
    }
  })
}

export default getListChildren
