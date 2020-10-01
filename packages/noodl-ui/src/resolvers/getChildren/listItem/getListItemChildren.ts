import _ from 'lodash'
import Logger from 'logsnap'
import {
  IComponent,
  NOODLComponent,
  ProxiedComponent,
  Resolver,
  ResolverConsumerOptions,
  ResolverOptions,
} from '../../../types'
import getChildrenDefault from '../default'
import getChildProps from '../getChildProps'

const log = Logger.create('getListItemChildren')

/**
 * List item components can expect some internal state/listItem from their parent list component
 * ex: We customly injected the "itemObject" prop to this component from the parent
 */
const getListItemChildren: Resolver = (
  component: IComponent,
  options: ResolverConsumerOptions & { resolverOptions: ResolverOptions },
) => {
  const { consume, resolveComponent, resolverOptions } = options
  const { children, iteratorVar, listId, listItemIndex = 0 } = component.get([
    'children',
    'parentId',
    'iteratorVar',
    'listId',
    'listItem',
    'listItemIndex',
  ])
  const parent = component.parent()
  const listItem = consume(component)

  let childComponent: ProxiedComponent

  const logMsg = `%ccomponent`
  console.log(logMsg, `color:#ec0000;font-weight:bold;`, {
    component,
    children,
    iteratorVar,
    listId,
    listItem,
    listItemIndex,
    parent,
  })

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
        component.set(
          'children',
          _.map(children, (child: NOODLComponent, index) => {
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
            childComponent = getChildProps(component, child, index, {
              listId,
              listItemIndex,
              ...otherProps,
            })
            return resolveComponent?.(childComponent, resolverOptions)
          }),
        )
      } else {
        if (_.isPlainObject(children)) {
          childComponent = getChildProps(component, children, {
            listId,
            listItemIndex,
            parent,
          })
          component.set(
            'children',
            resolveComponent(childComponent, resolverOptions),
          )
        }
      }
    }
  }
}

export default getListItemChildren
