import _ from 'lodash'
import Logger from 'logsnap'
import {
  IComponent,
  NOODLComponent,
  ProxiedComponent,
  ResolverFn,
  ConsumerOptions,
  ResolverOptions,
} from '../../../types'
import getChildrenDefault from '../default'
import getChildProps from '../getChildProps'

const log = Logger.create('getListItemChildren')

/**
 * List item components can expect some internal state/listItem from their parent list component
 * ex: We customly injected the "itemObject" prop to this component from the parent
 */
const getListItemChildren: ResolverFn = (
  component: IComponent,
  options: ConsumerOptions & { resolverOptions: ResolverOptions },
) => {
  const { getListItem, resolveComponent, resolverOptions } = options
  const { children, iteratorVar, listId, listItemIndex = 0 } = component.get([
    'children',
    'parentId',
    'iteratorVar',
    'listId',
    'listItem',
    'listItemIndex',
  ])
  const parent = component.parent()
  const listItem = getListItem(component)

  let noodlChildComponent: ProxiedComponent

  if (!listItem) {
    log.red(
      `A list component passed in an iteratorVar that a listItem component ` +
        `could not parse or retrieve`,
      {
        component: component.snapshot(),
        listId,
        listItem,
        listItemIndex,
        parent,
      },
    )
    getChildrenDefault(component, options)
  } else {
    if (!listId) {
      log.red(
        `A listItem component expects a "listId" but no listId was received`,
        {
          snapshot: component.snapshot(),
          parent,
          listId,
          listItem,
          listItemIndex,
        },
      )
    }
    // For regular lists (contentType: listObject)
    else {
      if (_.isArray(children)) {
        _.forEach(children, (child: NOODLComponent, index) => {
          let otherProps: { text?: string } | undefined
          if (_.isString(child?.dataKey)) {
            if (child.dataKey.startsWith(iteratorVar)) {
              if (_.isObjectLike(listItem) && !child.text) {
                otherProps = {
                  text: _.get(listItem, child.dataKey.split('.').slice(1)),
                }
              }
            }
          }
          noodlChildComponent = getChildProps(component, child, index, {
            listItem,
            listId,
            listItemIndex,
            ...otherProps,
          })
          component.createChild(
            resolveComponent?.(noodlChildComponent, resolverOptions),
          )
        })
      } else {
        if (_.isPlainObject(children)) {
          noodlChildComponent = getChildProps(component, children, {
            listId,
            listItemIndex,
            parent,
          })
          component.createChild(
            resolveComponent(noodlChildComponent, resolverOptions),
          )
        }
      }
    }
  }
}

export default getListItemChildren
