import _ from 'lodash'
import {
  IComponent,
  IComponentConstructor,
  IComponentTypeInstance,
  IComponentTypeObject,
  NOODLComponentType,
} from '../types'
import { forEachEntries } from './common'
import ListComponent from '../components/List/List'
import ListItemComponent from '../components/ListItem/ListItem'
import Component from '../components/Base'

/**
 * A helper/utility to create Component instances corresponding to their NOODL
 * component type
 * @param { string | object | Component } props - NOODL component type, a component object, or a Component instance
 * @param { object | undefined } options = Component args passed to the constructor
 */
function createComponent<K extends NOODLComponentType = NOODLComponentType>(
  noodlType: K,
  options?: ConstructorParameters<IComponentConstructor>,
): IComponentTypeInstance<K>

function createComponent<K extends NOODLComponentType = NOODLComponentType>(
  props: IComponentTypeObject,
  options?: ConstructorParameters<IComponentConstructor>,
): IComponentTypeInstance<K>

function createComponent<K extends NOODLComponentType = NOODLComponentType>(
  component: IComponentTypeInstance<K>,
  options?: ConstructorParameters<IComponentConstructor>,
): IComponentTypeInstance<K>

function createComponent<K extends NOODLComponentType = NOODLComponentType>(
  props: K | IComponentTypeObject | IComponentTypeInstance<K>,
  options?: ConstructorParameters<IComponentConstructor>,
): IComponentTypeInstance<K> {
  let childComponent: any
  let id: string = ''

  // NOODLComponentType
  if (typeof props === 'string') {
    childComponent = toInstance({ type: props, ...options })
  } else if (props instanceof Component) {
    // IComponentInstanceType
    childComponent = props
    id = childComponent.id
    if (options && _.isPlainObject(options)) {
      forEachEntries(options, (k, v) => childComponent.set(k, v))
    }
  } else {
    // IComponentObjectType
    childComponent = toInstance({ ...props, ...options })
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

function toInstance(props: IComponentTypeObject) {
  switch (props.noodlType || props.type) {
    case 'list':
      return new ListComponent(props)
    case 'listItem':
      return new ListItemComponent(props)
    default:
      return new Component(props) as IComponent
  }
}

export default createComponent
