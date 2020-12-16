import _ from 'lodash'
import { findChild, findParent, isComponent } from 'noodl-utils'
import List from '../components/List'
import ListItem from '../components/ListItem'
import Component from '../components/Base'

/**
 * Uses the value given to find a list corresponding to its relation.
 * Supports component id / instance
 * @param { Map } lists - Map of lists
 * @param { string | Component } component - Component id or instance
 */
function findList(
  lists: Map<List, List>,
  component: string | Component,
): any[] | null {
  let result: any[] | null = null

  if (component) {
    let listComponent: List
    let listComponents: List[]
    let listSize = lists.size

    // Assuming it is a component's id, we will use this and traverse the whole list,
    // comparing the id to each of the list's tree
    if (_.isString(component)) {
      let child: any
      const componentId = component
      listComponents = Array.from(lists.values())
      const fn = (c: Component) => !!c.id && c.id === componentId
      for (let index = 0; index < listSize; index++) {
        listComponent = listComponents[index]
        if (listComponent.id === component) {
          result = listComponent.getData()
          break
        }
        child = findChild(listComponent as any, fn as any)
        if (child) {
          result = listComponent.getData?.()
          break
        }
      }
    }
    // TODO - Unit tests were failing on this if condition below. Come back to this later
    // Directly return the data
    else if (component instanceof List) {
      result = component.getData()
    }
    // List item components should always be direct children of ListComponents
    else if (component instanceof ListItem) {
      result = (component.parent() as List)?.getData?.()
    }
    // Regular components should not hold the list data or data objects, so we
    // will assume here that it is some nested child. We can get the list by
    // traversing parents
    else if (isComponent(component)) {
      let parent: any
      listComponents = Array.from(lists.values())
      const fn = (c: any) => c === listComponent
      for (let index = 0; index < listSize; index++) {
        listComponent = listComponents[index]
        parent = findParent(component as any, fn)
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
