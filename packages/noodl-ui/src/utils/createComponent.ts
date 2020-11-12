import _ from 'lodash'
import {
  IComponent,
  IComponentTypeInstance,
  IComponentTypeObject,
  NOODLComponentType,
} from '../types'
import { forEachEntries } from './common'
import List from '../components/List'
import ListItem from '../components/ListItem'
import Component from '../components/Base'

export interface PropsOptionFunc<T> {
  (child: T): Partial<IComponentTypeObject>
}
export type PropsOptionObj = IComponentTypeObject

interface Options<T extends NOODLComponentType = NOODLComponentType> {
  props?: PropsOptionObj | PropsOptionFunc<IComponentTypeInstance<T>>
}

/**
 * A helper/utility to create Component instances corresponding to their NOODL
 * component type
 * @param { string | object | Component } value - NOODL component type, a component object, or a Component instance
 * @param { object | function | undefined } props = Component args passed to the constructor
 */
function createComponent<K extends NOODLComponentType = NOODLComponentType>(
  noodlType: K,
  options?: Options,
): IComponentTypeInstance<K>

function createComponent<K extends NOODLComponentType = NOODLComponentType>(
  value: IComponentTypeObject,
  options?: Options,
): IComponentTypeInstance<K>

function createComponent<K extends NOODLComponentType = NOODLComponentType>(
  component: IComponentTypeInstance<K>,
  options?: Options,
): IComponentTypeInstance<K>

function createComponent<K extends NOODLComponentType = NOODLComponentType>(
  value: K | IComponentTypeObject | IComponentTypeInstance<K>,
  options?: Options,
): IComponentTypeInstance<K> {
  let childComponent: any
  let id: string = ''
  const props = toProps(value, options)

  // NOODLComponentType
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
    if (childComponent.length) id += `[${childComponent.length}]`
    else id += '[0]'
  }

  // Resync the child's id to match the parent's id. This can possibly be the
  // case when we're re-rendering and choose to pass in existing component
  // instances to shortcut into parsing
  if (id !== childComponent.id) childComponent['id'] = id

  return childComponent
}

function toInstance(value: IComponentTypeObject) {
  switch (value.noodlType || value.type) {
    case 'list':
      return new List(value)
    case 'listItem':
      return new ListItem(value)
    default:
      return new Component(value) as IComponent
  }
}

function toProps(
  value: any,
  props?: Options['props'],
): Partial<IComponentTypeObject> | void {
  if (props) {
    if (_.isFunction(props)) return props(value)
    return props
  }
}

export default createComponent
