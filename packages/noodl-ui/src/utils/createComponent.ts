import isPlainObject from 'lodash/isPlainObject'
import { ComponentObject, ComponentType } from 'noodl-types'
import { ComponentInstance } from '../types'
import { forEachEntries } from './common'
import isComponent from './isComponent'
import Component from '../components/Base'

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
function createComponent<K extends ComponentType = ComponentType>(
  type: K,
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
): ComponentInstance {
  let childComponent: any
  let id: string = ''
  const props = toProps(value, options?.props)

  // ComponentType
  if (typeof value === 'string') {
    childComponent = new Component({ type: value, ...props })
  } else if (isComponent(value)) {
    // IComponentInstanceType
    childComponent = value
    id = childComponent.id
    if (props && isPlainObject(props)) {
      forEachEntries(props, (k, v) => childComponent.set(k, v))
    }
  } else {
    // IComponentObjectType
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
