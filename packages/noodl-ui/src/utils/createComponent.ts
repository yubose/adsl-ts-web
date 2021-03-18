import isPlainObject from 'lodash/isPlainObject'
import { ComponentObject } from 'noodl-types'
import { ComponentInstance, ComponentType } from '../types'
import { forEachEntries, getRandomKey } from './common'
import isComponent from './isComponent'
import Component from '../components/Base'
import List from '../components/List'
import ListItem from '../components/ListItem'
import Page from '../components/Page'

export interface PropsOptionFunc<T> {
  (child: T): Partial<PropsOptionObj>
}
export type PropsOptionObj = ComponentObject | { id?: string }

interface Options {
  props?: PropsOptionObj | PropsOptionFunc<ComponentInstance>
}

/**
 * A helper/utility to create Component instances corresponding to their NOODL
 * component type
 * @param { string | object | ComponentInstance } value - NOODL component type, a component object, or a Component instance
 * @param { object | function | undefined } props = Component args passed to the constructor
 */
function createComponent(noodlType: 'list', options?: Options): List
function createComponent(noodlType: 'listItem', options?: Options): ListItem
function createComponent(noodlType: 'page', options?: Options): Page
function createComponent<K extends ComponentType = ComponentType>(
  noodlType: K,
  options?: Options,
): ComponentInstance

function createComponent<K extends ComponentType = ComponentType>(
  value: PropsOptionObj,
  options?: Options,
): ComponentInstance

function createComponent<K extends ComponentType = ComponentType>(
  component: ComponentInstance,
  options?: Options,
): ComponentInstance

function createComponent<K extends ComponentType = ComponentType>(
  value: K | PropsOptionObj | Component,
  options?: Options,
): ComponentInstance | List | ListItem | Page {
  let childComponent: any
  let id: string = ''
  const props = toProps(value, options?.props)

  // ComponentType
  if (typeof value === 'string') {
    childComponent = toInstance({ type: value, ...props })
  } else if (isComponent(value)) {
    // IComponentInstanceType
    childComponent = value
    id = childComponent.id
    if (props && isPlainObject(props)) {
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

  return childComponent
}

function toInstance(value: PropsOptionObj) {
  if (!('children' in value)) {
    // value.children = []
  }
  switch (value.noodlType || value.type) {
    case 'list':
      return new List(value)
    case 'listItem':
      return new ListItem(value)
    case 'page':
      return new Page(value)
    default:
      return new Component(value)
  }
}

function toProps(
  value: any,
  props?: Options['props'],
): Partial<PropsOptionObj> | void {
  if (props) {
    if (typeof props === 'function') return props(value)
    return props
  }
}

export default createComponent
