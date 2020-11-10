import _ from 'lodash'
import {
  IComponent,
  IComponentConstructor,
  IComponentTypeInstance,
  IComponentTypeObject,
  IList,
  IListItem,
  NOODLComponentType,
} from '../types'
import ListComponent from '../components/List/List'
import ListItemComponent from '../components/ListItem/ListItem'
import Component from '../components/Base'
import { forEachEntries } from './common'

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
  let noodlType: NOODLComponentType
  let args: Partial<IComponentTypeObject>

  // NOODLComponentType
  if (typeof props === 'string') {
    noodlType = props
    args = { ...options }
  }
  // IComponentInstanceType
  else if (props instanceof Component) {
    if (options && _.isPlainObject(options)) {
      forEachEntries(options, (k, v) => props.set(k, v))
    }
    return props as IComponentTypeInstance<K>
  }
  // IComponentObjectType
  else {
    noodlType = props.noodlType || props.type
    args = { ...props, ...options }
  }

  switch (noodlType || props.type) {
    case 'list':
      return new ListComponent(args) as IList<'list'>
    case 'listItem':
      return new ListItemComponent(args) as IListItem<'listItem'>
    default:
      return new Component<K>({ ...args, type: noodlType }) as IComponent<K>
  }
}

export default createComponent
