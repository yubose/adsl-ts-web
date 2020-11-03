import _ from 'lodash'
import {
  IComponentType,
  IComponent,
  IComponentConstructor,
  NOODLComponentProps,
  NOODLComponentType,
  ProxiedComponent,
  IComponentTypeInstance,
  IComponentTypeObject,
} from '../types'
import ListComponent from '../components/List/List'
import ListItemComponent from '../components/ListItem/ListItem'
import Component from '../components/Base'

/**
 * A helper/utility to create Component instances corresponding to their NOODL
 * component type
 * @param { string | object | Component } props - NOODL component type, a component object, or a Component instance
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
  let noodlType: NOODLComponentType
  let args: Partial<IComponentTypeObject>
  if (typeof props === 'string') {
    noodlType = props
    args = { ...options }
  } else if (props instanceof Component) {
    return props as IComponentTypeInstance<K>
  } else {
    noodlType = props.noodlType || props.type
    args = { ...props, ...options }
  }
  switch (noodlType) {
    case 'list':
      return new ListComponent(args)
    case 'listItem':
      return new ListItemComponent(args)
    default:
      return new Component({ ...args, type: noodlType })
  }
}

export default createComponent
