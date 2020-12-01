import _ from 'lodash'
import fs, { WriteOptions } from 'fs-extra'
import path from 'path'
import getAlignAttrs from '../resolvers/getAlignAttrs'
import getBorderAttrs from '../resolvers/getBorderAttrs'
import getColors from '../resolvers/getColors'
import getCustomDataAttrs from '../resolvers/getCustomDataAttrs'
import getElementType, { getType } from '../resolvers/getElementType'
import getEventHandlers from '../resolvers/getEventHandlers'
import getFontAttrs from '../resolvers/getFontAttrs'
import getPosition from '../resolvers/getPosition'
import getReferences from '../resolvers/getReferences'
import getSizes from '../resolvers/getSizes'
import getStylesByElementType from '../resolvers/getStylesByElementType'
import getTransformedAliases from '../resolvers/getTransformedAliases'
import getTransformedStyleAliases from '../resolvers/getTransformedStyleAliases'
import NOODLUi from '../noodl-ui'
import Resolver from '../Resolver'
import Viewport from '../Viewport'
import {
  ResolverFn,
  IComponentTypeObject,
  IComponentTypeInstance,
  ConsumerOptions,
  NOODLComponentType,
} from '../types'
import createComponent from '../utils/createComponent'
import Component from '../components/Base'
import ListItem from '../components/ListItem'
import List from '../components/List'

export const assetsUrl = 'https://something.com/assets/'

export function createResolverTest(resolver: ResolverFn) {
  function _resolver<C extends IComponentTypeObject & { type: 'list' }>(
    component: C,
    options?: ConsumerOptions,
  ): List
  function _resolver<C extends IComponentTypeObject & { type: 'listItem' }>(
    component: C,
    options?: ConsumerOptions,
  ): ListItem
  function _resolver<
    C extends IComponentTypeObject & { type: NOODLComponentType }
  >(component: C, options?: ConsumerOptions): Component
  function _resolver<C extends IComponentTypeObject>(
    component: C,
    options?: ConsumerOptions,
  ) {
    const instance = createComponent({
      ...component,
      noodlType: component.noodlType || component.type,
    })
    resolver(instance as any, {
      ...noodlui.getConsumerOptions({ component: instance as any }),
      ...options,
    })
    return instance
  }
  return _resolver
}

export const noodlui = (function () {
  const viewport = new Viewport()
  viewport.width = 365
  viewport.height = 667

  const state = {
    client: new NOODLUi({ viewport }),
  }

  state.client.setAssetsUrl(assetsUrl)

  Object.defineProperty(state.client, 'cleanup', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function () {
      state.client.reset()
      state.client.initialized = true
    },
  })

  _.reduce(
    getAllResolvers(),
    (acc, r) => acc.concat(new Resolver().setResolver(r)),
    [] as Resolver[],
  ).forEach((r) => state.client.use(r))

  Object.defineProperty(state.client, 'save', {
    configurable: true,
    writable: true,
    value: function (filepath: string, data: any, options: WriteOptions) {
      fs.writeJsonSync(path.resolve(path.join(process.cwd(), filepath)), data, {
        spaces: 2,
        ...options,
      })
    },
  })

  return state.client as NOODLUi & {
    cleanup: () => void
    save: (filepath: string, data: any, options?: Partial<WriteOptions>) => void
  }
})()

export function getAllResolvers() {
  return [
    getAlignAttrs,
    getBorderAttrs,
    getColors,
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

export function toDOM<
  C extends IComponentTypeInstance,
  N extends HTMLElement = HTMLElement
>(
  noodlComponent: IComponentTypeObject,
  parentNode?: any,
): {
  component: C
  node: N
  parentNode: N | null
} {
  const component = noodlui.resolveComponents(noodlComponent) as C
  const node = document.createElement(getType(component)) as N
  parentNode = parentNode || document.body
  parentNode.appendChild(node)
  return { component, node, parentNode }
}
