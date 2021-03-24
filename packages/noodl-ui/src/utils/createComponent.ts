import isPlainObject from 'lodash/isPlainObject'
import { ComponentObject } from 'noodl-types'
import { NOODLUIComponentType } from '../types'
import isComponent from './isComponent'
import Component from '../components/Base'

export interface PropsOptionFunc<T> {
  (child: T): Partial<PropsOptionObj>
}
export type PropsOptionObj = ComponentObject & { id?: string }

interface Options {
  props?: PropsOptionObj | PropsOptionFunc<Component>
}

/**
 * A helper/utility to create Component instances corresponding to their NOODL
 * component type
 * @param { string | object | Component } component - NOODL component type, a component object, or a Component instance
 * @param { object | function | undefined } props = Component args passed to the constructor
 */
function createComponent<K extends NOODLUIComponentType = NOODLUIComponentType>(
  type: K,
  options?: Options,
): Component

function createComponent<K extends NOODLUIComponentType = NOODLUIComponentType>(
  value: PropsOptionObj,
  options?: Options,
): Component

function createComponent<K extends NOODLUIComponentType = NOODLUIComponentType>(
  component: Component,
  options?: Options,
): Component

function createComponent<K extends NOODLUIComponentType = NOODLUIComponentType>(
  value: K | PropsOptionObj | Component,
  options?: Options,
): Component {
  let childComponent: any
  const props = toProps(value, options?.props)
  if (typeof value === 'string') {
    childComponent = new Component({ type: value, ...props })
  } else if (isComponent(value)) {
    if (props && isPlainObject(props)) value.edit(props)
  } else {
    childComponent = new Component({ ...value, ...props })
  }
  return childComponent
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
