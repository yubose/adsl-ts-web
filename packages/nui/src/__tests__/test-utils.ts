import { actionFactory, componentFactory } from 'noodl-ui-test-utils'
import Nui from '../nui'
import NUIPage from '../Page'
import Viewport from '../Viewport'

export const assetsUrl = 'https://something.com/assets/'
export const nui = Nui
export const viewport = new Viewport()
export const ui = { ...actionFactory, ...componentFactory }

const isNil = (v: any) => v === null || v === undefined || v === ''

export function createDataKeyReference({
  page = Nui.getRootPage(),
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
    ...Nui.getRoot()[pageName],
    ...pageObject,
  }
  if (page.page !== pageName) page.page = pageName
  const root = { ...Nui.getRoot(), [pageName]: pageObject }
  Nui.use({ getRoot: () => root })
  return { page }
}
