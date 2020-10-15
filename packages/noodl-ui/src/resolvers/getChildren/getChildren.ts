import _ from 'lodash'
import { isIteratorVarConsumer } from '../../utils/noodl'
import {
  IComponent,
  ProxiedComponent,
  ResolverOptions,
  ResolverConsumerOptions,
} from '../../types'
import getChildProps from './getChildProps'
import getChildrenDefault from './default'
import getListChildren from './list'
import getListItemChildren from './listItem'
import getListItemItemObjectConsumer from './listItemObjectConsumers'
import getTextBoardChildren from './textBoard'

/**
 * Computes the children and returns an object like { children }
 *  Added index so that react doesn't complain about duplicate keys
 */
function getChildren(
  component: IComponent,
  options: ResolverConsumerOptions & { resolverOptions: ResolverOptions },
): void {
  const { resolveComponent, resolverOptions } = options
  const { text, textBoard, type, children, iteratorVar = '' } = component.get([
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

export default getChildren
