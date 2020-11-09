import _ from 'lodash'
import Logger from 'logsnap'
import { isIteratorVarConsumer } from '../../utils/noodl'
import {
  ConsumerOptions,
  IComponent,
  IComponentTypeInstance,
  IList,
  IListItem,
  ProxiedComponent,
  ResolverOptions,
} from '../../types'
import createChild from '../../utils/createChild'
import getChildProps from './getChildProps'
import getChildrenDefault from './default'
import getListChildren from './list'
import getListItemChildren from './listItem'
import getListItemItemObjectConsumer from './listItemObjectConsumers'
import getTextBoardChildren from './textBoard'

const log = Logger.create('getChildren')

/**
 * Computes the children and returns an object like { children }
 *  Added index so that react doesn't complain about duplicate keys
 */
function getChildren(
  component: IComponentTypeInstance,
  options: ConsumerOptions & { resolverOptions: ResolverOptions },
): void {
  const { resolveComponent, resolverOptions } = options

  if (component.noodlType === 'list') {
    const listComponent = component as IList
    // const listObject = listComponent.getData()
    // if (listObject?.length) {
    // _.forEach(listObject, (dataObject) => {
    //   const blueprint = listComponent.getBlueprint() as IListItem
    //   const listItemComponent = listComponent.createChild(blueprint)
    //   listItemComponent.setDataObject(dataObject)
    // })
    // }
  }

  // if (originalChildren) {
  //   _.forEach(
  //     _.isArray(originalChildren) ? originalChildren : [originalChildren],
  //     (noodlChild) => {
  //       if (noodlChild) {
  //         console.info(noodlChild)
  //         resolveComponent(component.createChild(noodlChild))
  //       }
  //     },
  //   )
  // }

  return
  const { text, textBoard, type, iteratorVar = '' } = component.get([
    'text',
    'textBoard',
    'type',
    'children',
    'iteratorVar',
  ])

  // Immediately transfer the call here since components that are dependent
  // on itemObject data need special handling
  if (isIteratorVarConsumer(iteratorVar as string, component)) {
    getListItemItemObjectConsumer(component, options)
  }
  // Text is a string, which is a valid ReactNode. Currently if there is text in the
  // NOODL then theres most likely no children since text is the children itself
  // else if (text) {
  //   // TODO: Finish converting to createChild implementation
  //   // component.createChild()
  //   component.set('children', text)
  // }
  // Text board components render their children in a way that allows texts
  // within a text to be styled
  else if (textBoard) {
    getTextBoardChildren(component, options)
  }
  // Children is an array which will most likely implement the list flow for
  // list items
  else if (_.isArray(children)) {
    if (type === 'list') {
      getListChildren(component, options)
    } else if (type === 'listItem') {
      getListItemChildren(component, options)
    } else if (isIteratorVarConsumer(iteratorVar as string, component)) {
      getListItemItemObjectConsumer(component, options)
    } else {
      getChildrenDefault(component, options)
    }
  }
  // Children is either not existent or it is some primitive or object-like value
  else if (children) {
    // Assuming now that component.children is a single NOODL component
    if (_.isPlainObject(children)) {
      const child = getChildProps(
        component,
        children as any,
      ) as ProxiedComponent
      component.createChild(resolveComponent(child, resolverOptions))
    }
  }
}

// This is a custom use case to manually take this out during the resolving process
// in order to reorder the arguments for getChildren to render its tree hiearchy
// like resolveComponent does
// @ts-ignore
getChildren.getChildren = true

function handleChildren(
  parent: IComponentTypeInstance,
  resolvedChild: IComponentTypeInstance,
  options: ConsumerOptions,
) {
  switch (resolvedChild.noodlType) {
    case 'listItem': {
    }
  }
}

export default getChildren
