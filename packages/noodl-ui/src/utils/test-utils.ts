import NUI from '../noodl-ui'
import NUIPage from '../Page'
import Viewport from '../Viewport'
import { isNil } from '../utils/internal'

export const assetsUrl = 'https://something.com/assets/'

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
