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
  NOODL as NOODLUi,
  NOODLComponentProps,
  Resolver,
  ResolverFn,
  Viewport,
} from 'noodl-ui'
import { NOODLDOMElement } from 'noodl-ui-dom'
import noodluidom from '../app/noodl-ui-dom'

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

export const assetsUrl = 'https://aitmed.com/assets/'

export const noodlui = (function () {
  const state = {
    client: new NOODLUi(),
  }

  function _cleanup() {
    state.client
      .reset()
      .setAssetsUrl(assetsUrl)
      .setPage('MeetingLobby')
      .setViewport(new Viewport())
      .setRoot({
        MeetingLobby: {
          module: 'meetingroom',
          title: 'Meeting Lobby',
          formData: { phoneNumber: '', password: '', code: '' },
        },
      })
  }

  Object.defineProperty(state.client, 'cleanup', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: _cleanup,
  })

  _.forEach(getAllResolvers(), (r) => {
    const resolver = new Resolver()
    resolver.setResolver(r)
    state.client.use(resolver)
  })

  return state.client as NOODLUi & { cleanup: () => void }
})()

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

export { noodluidom }

export function toDOM(props: any): NOODLDOMElement | null {
  const node = noodluidom.parse(props)
  document.body.appendChild(node as NOODLDOMElement)
  return node
}
