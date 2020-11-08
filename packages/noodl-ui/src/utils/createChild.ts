import _ from 'lodash'
import {
  IComponentType,
  IComponentTypeInstance,
  NOODLComponentType,
} from '../types'
import Component from '../components/Base'

/**
 * Creates and appends the new child instance to the childrens list
 * (Does not set the parent of the child)
 * @param { IComponentType } props
 */
function createChild<K extends NOODLComponentType>(
  child: IComponentType,
): IComponentTypeInstance<K> | undefined {
  let childComponent: any
  let id: string = `${this.id}`
  if (this.length >= 1) id += `[${this.length}]`
  else id += '[0]'
  if (_.isString(child)) {
    childComponent = new Component({ type: child })
  } else if (child instanceof Component) {
    childComponent = child
  } else {
    if (!child?.type) return
    childComponent = new Component({ ...child, id })
  }
  // Resync the child's id to match the parent's id. This can possibly be the
  // case when we're re-rendering and choose to pass in existing component
  // instances to shortcut into parsing
  if (id !== childComponent.id) childComponent['id'] = id

  return childComponent
}

export default createChild
