import * as u from '@jsmanifest/utils'
import cache from './_cache'
import NuiPage from './Page'
import NuiViewport from './Viewport'

export default function getRootPage() {
  if (!cache.page.has('root')) {
    return cache.page.create({ viewport: new NuiViewport() })
  }
  return u.array(cache.page.get('root'))[0]?.page as NuiPage
}
