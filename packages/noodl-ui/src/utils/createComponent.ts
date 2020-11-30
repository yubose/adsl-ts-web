import _ from 'lodash'
import { ComponentObject, ComponentType } from '../types'
import { forEachEntries, getRandomKey } from './common'
import List from '../components/List'
import ListItem from '../components/ListItem'
import Component from '../components/Base'

export interface PropsOptionFunc<T> {
  (child: T): Partial<ComponentObject>
}
export type PropsOptionObj = ComponentObject

interface Options {
  props?: PropsOptionObj | PropsOptionFunc<Component>
}

/**
 * A helper/utility to create Component instances corresponding to their NOODL
 * component type
 * @param { string | object | Component } value - NOODL component type, a component object, or a Component instance
 * @param { object | function | undefined } props = Component args passed to the constructor
 */
function createComponent(noodlType: 'list', options?: Options): List
function createComponent(noodlType: 'listItem', options?: Options): ListItem
function createComponent<K extends ComponentType = ComponentType>(
  noodlType: K,
  options?: Options,
): Component

function createComponent<K extends ComponentType = ComponentType>(
  value: ComponentObject,
  options?: Options,
): Component

function createComponent<K extends ComponentType = ComponentType>(
  component: Component,
  options?: Options,
): Component

function createComponent<K extends ComponentType = ComponentType>(
  value: K | ComponentObject | Component,
  options?: Options,
): Component | List | ListItem {
  let childComponent: any
  let id: string = ''
  const props = toProps(value, options?.props)

  // ComponentType
  if (typeof value === 'string') {
    childComponent = toInstance({ type: value, ...props })
  } else if (value instanceof Component) {
    // IComponentInstanceType
    childComponent = value
    id = childComponent.id
    if (props && _.isPlainObject(props)) {
      forEachEntries(props, (k, v) => childComponent.set(k, v))
    }
  } else {
    // IComponentObjectType
    childComponent = toInstance({ ...value, ...props })
  }

  if (!id) {
    if (childComponent.length) id += `[${childComponent.length - 1}]`
    else id += getRandomKey()
  }

  // Resync the child's id to match the parent's id. This can possibly be the
  // case when we're re-rendering and choose to pass in existing component
  // instances to shortcut into parsing
  if (id !== childComponent.id) childComponent['id'] = id

  return childComponent
}

function toInstance(value: ComponentObject) {
  if (!('children' in value)) {
    // value.children = []
  }
  switch (value.noodlType || value.type) {
    case 'list':
      return new List(value)
    case 'listItem':
      return new ListItem(value)
    default:
      return new Component(value)
  }
}

function toProps(
  value: any,
  props?: Options['props'],
): Partial<ComponentObject> | void {
  if (props) {
    if (_.isFunction(props)) return props(value)
    return props
  }
}

export default createComponent
