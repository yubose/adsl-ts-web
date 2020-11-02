import _ from 'lodash'
import { findChild, findParent } from 'noodl-utils'
import { IComponent, IList, IComponentTypeInstance } from '../types'
import ListComponent from '../components/List/List'
import ListItemComponent from '../components/ListItem/ListItem'
import Component from '../components/Base/Base'

/**
 * Uses the value given to find a list corresponding to its relation.
 * Supports component id / instance
 * @param { Map } lists - Map of lists
 * @param { string | IComponentTypeInstance } component - Component id or instance
 */
function findList(
  lists: Map<IList, IList>,
  component: string | IComponentTypeInstance,
): any[] | null {
  let result: any[] | null = null

  if (component) {
    let listComponent: IList
    let listComponents: IList[]
    let listSize = lists.size

    // Assuming it is a component's id, we will use this and traverse the whole list,
    // comparing the id to each of the list's tree
    if (_.isString(component)) {
      let child: any
      const componentId = component
      listComponents = Array.from(lists.values())
      const fn = (c: IComponent) => !!c.id && c.id === componentId
      for (let index = 0; index < listSize; index++) {
        listComponent = listComponents[index]
        if (listComponent.id === component) {
          result = listComponent.getData()
          break
        }
        child = findChild(listComponent, fn)
        if (child) {
          result = listComponent.getData?.()
          break
        }
      }
    }
    // TODO - Unit tests were failing on this if condition below. Come back to this later
    // Directly return the data
    else if (component instanceof ListComponent) {
      result = component.getData()
    }
    // List item components should always be direct children of ListComponents
    else if (component instanceof ListItemComponent) {
      result = (component.parent() as IList)?.getData?.()
    }
    // Regular components should not hold the list data or data objects, so we
    // will assume here that it is some nested child. We can get the list by
    // traversing parents
    else if (component instanceof Component) {
      let parent: any
      listComponents = Array.from(lists.values())
      const fn = (c: IComponent) => c === listComponent
      for (let index = 0; index < listSize; index++) {
        listComponent = listComponents[index]
        parent = findParent(component, fn)
        if (parent) {
          result = parent.getData?.()
          break
        }
      }
    }
  }

  return result
}

export default findList
