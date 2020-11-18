import _ from 'lodash'
import { queryHelpers } from '@testing-library/dom'
import {
  getElementType,
  getAlignAttrs,
  getBorderAttrs,
  getCustomDataAttrs,
  getChildren,
  getColors,
  getEventHandlers,
  getFontAttrs,
  getPosition,
  getReferences,
  getStylesByElementType,
  getSizes,
  getTransformedAliases,
  getTransformedStyleAliases,
  ResolverFn,
} from 'noodl-ui'
import { NOODLDOMElement } from 'noodl-ui-dom'
import noodlui from '../app/noodl-ui'
import noodluidom from '../app/noodl-ui-dom'
import Page from '../Page'

export function getByDataKey(dataKey: string, container?: Element) {
  return (container || document.body).querySelector(`[data-key="${dataKey}"]`)
}

export function getByDataName(dataKey: string, container?: Element) {
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

export const assetsUrl = 'https://aitmed.com/assets/'

export function getAllResolvers() {
  return [
    getAlignAttrs,
    getBorderAttrs,
    getColors,
    getChildren,
    getCustomDataAttrs,
    getElementType,
    getEventHandlers,
    getFontAttrs,
    getPosition,
    getReferences,
    getSizes,
    getStylesByElementType,
    getTransformedAliases,
    getTransformedStyleAliases,
  ] as ResolverFn[]
}

export { noodlui, noodluidom }

export const page = new Page()

export function toDOM(props: any): NOODLDOMElement | null {
  const node = noodluidom.parse(props)
  if (page.rootNode) page.rootNode?.appendChild(node as NOODLDOMElement)
  else throw new Error('No root node exists in Page')
  return node
}
