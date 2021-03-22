import fs from 'fs-extra'
import set from 'lodash/set'
import { ComponentObject, PageComponentObject } from 'noodl-types'
import { ResolverFn, ConsumerOptions, ComponentInstance } from '../types'
import NUI from '../noodl-ui'
import NUIPage from '../Page'
import Viewport from '../Viewport'
import _internalResolver from '../resolvers/_internal'
import handlePageInternalResolver from '../resolvers/_internal/handlePage'
import createComponent from '../utils/createComponent'
import Component from '../components/Base'
import ListItem from '../components/ListItem'
import List from '../components/List'
import Page from '../components/Page'
import { isNil } from '../utils/internal'

export const assetsUrl = 'https://something.com/assets/'

export function createResolverTest(
  resolver: ResolverFn | typeof handlePageInternalResolver,
  consumerOptions?: Partial<ConsumerOptions>,
  ref?: NUIPage,
) {
  function _resolver<C extends PageComponentObject>(
    component: C,
    options?: ConsumerOptions,
    ref?: NUIPage,
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
    overriddenRef?: NUIPage,
  ) {
    const instance = createComponent({
      ...component,
      type: component.type,
    })
    resolver(instance as any, {
      ...NUI.getConsumerOptions({
        component: instance as ComponentInstance,
      }),
      ...options,
      ...consumerOptions,
    })
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

export const viewport = new Viewport()

export function createDataKeyReference({
  page = NUI.getRootPage(),
  pageName = page.page,
  pageObject,
}: {
  page?: NUIPage
  pageName?: string
  pageObject?: Record<string, any>
}) {
  if (isNil(page.viewport.width)) page.viewport.width = 375
  if (isNil(page.viewport.height)) page.viewport.height = 667
  pageObject = {
    ...NUI.getRoot()[pageName],
    ...pageObject,
  }
  if (page.page !== pageName) page.page = pageName
  const root = { ...NUI.getRoot(), [pageName]: pageObject }
  NUI.use({ getRoot: () => root })
  return { page }
}
