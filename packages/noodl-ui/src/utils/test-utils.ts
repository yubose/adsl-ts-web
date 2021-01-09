import { ComponentObject, PageComponentObject } from 'noodl-types'
import fs from 'fs-extra'
import { getTagName } from '../resolvers/getElementType'
import NOODLUi from '../noodl-ui'
import Viewport from '../Viewport'
import { ResolverFn, ConsumerOptions, ComponentInstance } from '../types'
import { InternalResolver } from '../Resolver'
import handlePageInternalResolver from '../resolvers/_internal/handlePage'
import createComponent from '../utils/createComponent'
import Component from '../components/Base'
import ListItem from '../components/ListItem'
import List from '../components/List'
import Page from '../components/Page'

export const assetsUrl = 'https://something.com/assets/'

export function createResolverTest(
  resolver: ResolverFn | typeof handlePageInternalResolver,
  consumerOptions?: Partial<ConsumerOptions>,
  ref?: NOODLUi,
) {
  function _resolver<C extends PageComponentObject>(
    component: C,
    options?: ConsumerOptions,
    ref?: NOODLUi,
  ): Page
  function _resolver<C extends ComponentObject>(
    component: C,
    options?: ConsumerOptions,
  ): List
  function _resolver<C extends ComponentObject>(
    component: C,
    options?: ConsumerOptions,
  ): ListItem
  function _resolver<C extends ComponentObject>(
    component: C,
    options?: ConsumerOptions,
  ): Component
  function _resolver<C extends ComponentObject>(
    component: C,
    options?: ConsumerOptions,
    overriddenRef?: NOODLUi,
  ) {
    const instance = createComponent({
      ...component,
      noodlType: component.noodlType || component.type,
    })
    resolver(
      instance as any,
      {
        ...noodlui.getConsumerOptions({
          component: instance as ComponentInstance,
        }),
        ...options,
        ...consumerOptions,
      },
      overriddenRef || ref || noodlui,
    )
    return instance
  }
  return _resolver
}

export function saveToFs(
  filepath: string,
  data: any,
  options?: Partial<fs.WriteOptions>,
) {
  fs.writeJsonSync(filepath, data, {
    spaces: 2,
    ...options,
  })
}

export const noodlui = new NOODLUi()

export const viewport = new Viewport()

export function toDOM<C extends Component, N extends HTMLElement = HTMLElement>(
  noodlComponent: ComponentObject,
  parentNode?: any,
): {
  component: C
  node: N
  parentNode: N | null
} {
  const component = noodlui.resolveComponents(noodlComponent) as C
  const node = document.createElement(getTagName(component)) as N
  parentNode = parentNode || document.body
  parentNode.appendChild(node)
  return { component, node, parentNode }
}
