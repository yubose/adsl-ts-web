import {
  ComponentInstance,
  ComponentObject,
  ComponentType,
  eventTypes,
  isComponent,
  NOODLComponent,
  SelectOption,
} from 'noodl-ui'

/**
 * Creates an image element that loads asynchronously
 * @param { HTMLElement } container - Element to attach the image in
 * @param { object } options
 * @param { function | undefined } options.onLoad
 * @param { number | undefined } options.timeout
 */
export function createAsyncImageElement(
  container: HTMLElement,
  opts?: { onLoad?(event: Event): void; timeout?: number },
) {
  let node = new Image()
  node.onload = (event) => {
    if (!container) container = document.body
    container.insertBefore(node as HTMLImageElement, container.childNodes[0])
    opts?.onLoad?.(event)
  }
  return node
}

export function createEmptyObjectWithKeys<K extends string = any, I = any>(
  keys: K[],
  initiatingValue?: I,
  startingValue?: any,
): Record<K, I> {
  return keys.reduce(
    (acc = {}, key) => Object.assign(acc, { [key]: initiatingValue }),
    startingValue,
  )
}

export const get = <T = any>(o: T, k: string) => {
  if (typeof o !== 'object' || typeof k !== 'string') return

  let parts = k.split('.').reverse()
  let result: any = o
  let key = ''

  while (parts.length) {
    key = parts.pop() as string
    result = result[key]
  }

  return result
}

export function getDataAttribKeys() {
  return [
    'data-key',
    'data-listid',
    'data-name',
    'data-viewtag',
    'data-value',
    'data-ux',
  ] as (
    | 'data-key'
    | 'data-listid'
    | 'data-name'
    | 'data-viewtag'
    | 'data-value'
    | 'data-ux'
  )[]
}

/**
 *
 * @param { ComponentInstance | ComponentObject | ComponentType } component - NOODL component object, instance, or type
 */
export function getShape(
  component: ComponentInstance,
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject
export function getShape(
  noodlComponent: ComponentObject,
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject
export function getShape(
  componentType: ComponentType,
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject
export function getShape(
  components: (ComponentInstance | ComponentObject | ComponentType)[],
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject
export function getShape(
  component: ComponentInstance | ComponentObject | ComponentType,
  opts?: { parent?: ComponentObject; shapeKeys?: string[] },
): ComponentObject {
  const shape = {} as ComponentObject
  let shapeKeys = getShapeKeys()
  if (opts?.parent) {
    shapeKeys = shapeKeys.concat(
      getDynamicShapeKeys(
        opts.parent,
        isComponent(component)
          ? component.original
          : (component as ComponentObject),
      ),
    )
  }
  if (opts?.shapeKeys) {
    shapeKeys = shapeKeys.concat(opts.shapeKeys)
  }

  if (isComponent(component)) {
    return getShape(component.original, { ...opts, parent: component.original })
  } else if (typeof component === 'string') {
    return { type: component }
  } else if (Array.isArray(component)) {
    return component.map((c) => getShape(c, opts))
  } else if (component && typeof component === 'object') {
    const noodlComponent = component as ComponentObject
    // The noodl yml may also place the value of iteratorVar as a property
    // as an empty string. So we include the value as a property to keep as well
    shapeKeys.forEach((key) => {
      if (key in noodlComponent) {
        if (key === 'children') {
          // @ts-expect-error
          shape.children = Array.isArray(noodlComponent.children)
            ? (noodlComponent.children as ComponentObject[])?.map(
                (noodlChild) =>
                  getShape(noodlChild, {
                    ...opts,
                    parent: noodlComponent,
                  }),
              )
            : getShape(noodlComponent.children as any, {
                ...opts,
                // @ts-expect-error
                noodlType:
                  (opts as any)?.noodlType ||
                  (typeof noodlComponent.children === 'object'
                    ? (noodlComponent.children as any).noodlType ||
                      (noodlComponent.children as any).type
                    : typeof noodlComponent.children === 'string'
                    ? noodlComponent.children
                    : undefined) ||
                  (opts as any)?.type,
                parent: noodlComponent,
              })
        } else {
          shape[key] = noodlComponent[key]
        }
      }
    })
  }
  return shape
}

export function getShapeKeys<K extends keyof NOODLComponent>(...keys: K[]) {
  const regex = /(required?)\s*$/i
  return [
    'type',
    'style',
    'children',
    'controls',
    'dataKey',
    'contentType',
    'inputType',
    'isEditable',
    'iteratorVar',
    'listObject',
    'maxPresent',
    'noodlType',
    'options',
    'path',
    'pathSelected',
    'poster',
    'placeholder',
    'resource',
    'required',
    'selected',
    'text',
    'textSelectd',
    'textBoard',
    'text=func',
    'viewTag',
    'videoFormat',
    ...eventTypes,
    ...keys,
  ] as string[]
}

/**
 * Returns the HTML DOM node or an array of HTML DOM nodes using the data-ux,
 * otherwise returns null
 * @param { string } key - The value of a data-ux element
 */
export function getByDataUX(key: string) {
  if (typeof key === 'string') {
    const nodeList = document.querySelectorAll(`[data-ux="${key}"]`) || null
    if (nodeList.length) {
      const nodes = [] as HTMLElement[]
      nodeList.forEach((node: HTMLElement, key) => {
        nodes.push(node)
      })
      return nodes.length === 1 ? nodes[0] : nodes
    }
  }
  return null
}

export function getDynamicShapeKeys(
  noodlParent: ComponentObject,
  noodlChild: ComponentObject,
) {
  const shapeKeys = [] as string[]
  if (noodlParent?.iteratorVar) {
    if (noodlParent.iteratorVar in noodlChild) {
      shapeKeys.push(noodlParent.iteratorVar)
    }
  }
  return shapeKeys
}

/**
 * Returns true if the value can be displayed in the UI as normal.
 * A displayable value is any value that is a string or number
 * @param { any } value
 */
export function isDisplayable(value: unknown): value is string | number {
  return value == 0 || typeof value === 'string' || typeof value === 'number'
}

export function normalizeEventName(eventName: string) {
  return typeof eventName === 'string'
    ? eventName.startsWith('on')
      ? eventName.replace('on', '').toLowerCase()
      : eventName.toLowerCase()
    : eventName
}

/**
 * Simulates a user-click and opens the link in a new tab.
 * @param { string } url - An outside link
 */
export function openOutboundURL(url: string) {
  if (typeof window !== 'undefined') {
    window.location.href = url
  }
}

export function optionExists(node: HTMLSelectElement, option: any) {
  return (
    !!node &&
    !!option &&
    [...node.options].some((opt) => opt.value === toSelectOption(option).value)
  )
}

export function isTextFieldLike(
  node: unknown,
): node is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return !!(
    node &&
    node instanceof HTMLElement &&
    (node.tagName === 'INPUT' ||
      node.tagName === 'SELECT' ||
      node.tagName === 'TEXTAREA')
  )
}

export function toSelectOption(value: any): SelectOption {
  if (typeof value !== 'object') {
    return { key: value, label: value, value }
  }
  return value
}
