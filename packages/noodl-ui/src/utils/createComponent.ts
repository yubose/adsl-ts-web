import _ from 'lodash'
import {
  ComponentType,
  IComponent,
  IComponentConstructor,
  NOODLComponentProps,
  NOODLComponentType,
  ProxiedComponent,
} from '../types'
import ListComponent from '../ListComponent'
import ListItemComponent from '../ListItemComponent'
import Component from '../Component'

/**
 * A helper/utility to create Component instances corresponding to their NOODL
 * component type
 * @param { string | object | Component } props - NOODL component type, a component object, or a Component instance
 */
function createComponent(
  noodlType: NOODLComponentType,
  options?: ConstructorParameters<IComponentConstructor>,
): IComponent
function createComponent(
  props: ComponentType,
  options?: ConstructorParameters<IComponentConstructor>,
): IComponent
function createComponent(
  props: ComponentType | NOODLComponentType,
  options?: ConstructorParameters<IComponentConstructor>,
) {
  let noodlType: NOODLComponentType
  let args: Partial<ProxiedComponent | NOODLComponentProps>
  if (typeof props === 'string') {
    noodlType = props
    args = { ...options }
  } else if (props instanceof Component) {
    return props
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
