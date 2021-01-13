import { queryHelpers } from '@testing-library/dom'
import { NOODLDOMElement, Page } from 'noodl-ui-dom'
import { ComponentInstance, Viewport } from 'noodl-ui'
import noodlui from '../app/noodl-ui'
import noodluidom from '../app/noodl-ui-dom'

export { noodlui, noodluidom }

export const page = new Page()
export const assetsUrl = 'https://aitmed.com/assets/'
export const root = { GeneralInfo: { Radio: [{ key: 'Gender', value: '' }] } }
export const viewport = new Viewport()

export const deviceSize = {
  galaxys5: { width: 360, height: 640, aspectRatio: 0.5621345029239766 },
  iphone6: { width: 375, height: 667, aspectRatio: 0.562545720555962 },
  ipad: { width: 768, height: 1024, aspectRatio: 0.7495126705653021 },
  widescreen: { width: 1920, height: 1080, aspectRatio: 1.777777777777778 },
} as const

export class MockNoodl {
  assetsUrl = assetsUrl
  emitCall = (arg: any) => Promise.resolve(arg)
  root = root
}

// Mock noodl SDK
export const noodl = new MockNoodl()

export function getByDataKey(dataKey: string, container?: Element) {
  return (container || document.body).querySelector(`[data-key="${dataKey}"]`)
}

export function getByDataListId(dataKey: string, container?: Element) {
  return (container || document.body).querySelector(`[data-key="${dataKey}"]`)
}

export function getByDataUx(dataKey: string, container?: Element) {
  return (container || document.body).querySelector(`[data-key="${dataKey}"]`)
}

export function getByDataValue(dataKey: string, container?: Element) {
  return (container || document.body).querySelector(`[data-key="${dataKey}"]`)
}

export function getAllByDataKey(dataKey: string, container?: Element) {
  return (container || document.body).querySelectorAll(
    `[data-key="${dataKey}"]`,
  )
}

export function getAllByDataName(dataKey: string, container?: Element) {
  return (container || document.body).querySelectorAll(
    `[data-key="${dataKey}"]`,
  )
}

export function getAllByDataListId(dataKey: string, container?: Element) {
  return (container || document.body).querySelectorAll(
    `[data-key="${dataKey}"]`,
  )
}

export function getAllByDataUx(dataKey: string, container?: Element) {
  return (container || document.body).querySelectorAll(
    `[data-key="${dataKey}"]`,
  )
}

export function getAllByDataValue(dataKey: string, container?: Element) {
  return (container || document.body).querySelectorAll(
    `[data-key="${dataKey}"]`,
  )
}

export const queryByDataKey = queryHelpers.queryByAttribute.bind(
  null,
  'data-key',
)

export const queryByDataListId = queryHelpers.queryByAttribute.bind(
  null,
  'data-listid',
)

export const queryByDataName = queryHelpers.queryByAttribute.bind(
  null,
  'data-name',
)

export const queryByDataValue = queryHelpers.queryByAttribute.bind(
  null,
  'data-value',
)

export const queryByDataUx = queryHelpers.queryByAttribute.bind(null, 'data-ux')

export const queryByDataViewtag = queryHelpers.queryByAttribute.bind(
  null,
  'data-viewtag',
)

export function toDOM<
  N extends NOODLDOMElement = NOODLDOMElement,
  C extends ComponentInstance = any
>(props: any) {
  let node: N | null = null
  let component: C | undefined
  if (typeof props?.children === 'function') {
    node = noodluidom.draw(props as any) as N
    component = props as any
  } else if (typeof props === 'object' && 'type' in props) {
    component = noodlui.resolveComponents(props) as any
    // @ts-expect-error
    node = noodluidom.draw(component) as N
  }
  if (node) document.body.appendChild(node as any)
  return [node, component] as [NonNullable<N>, C]
}
