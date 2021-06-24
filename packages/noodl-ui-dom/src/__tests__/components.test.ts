import { expect } from 'chai'
import { prettyDOM, waitFor } from '@testing-library/dom'
import * as u from '@jsmanifest/utils'
import * as mock from 'noodl-ui-test-utils'
import * as ncom from 'noodl-common'
import { isPage as isNUIPage, NUIComponent } from 'noodl-ui'
import isNDOMPage from '../utils/isPage'
import {
  createDataKeyReference,
  createRender,
  ndom,
  viewport,
} from '../test-utils'
import NDOM from '../noodl-ui-dom'

describe(ncom.coolGold('components'), () => {
  describe(ncom.italic(`Page`), () => {
    it(`should eventually set the nui page instance on the component`, async () => {
      const pageComponentObject = mock.getPageComponent({
        type: 'page',
        path: 'Cereal',
        style: { width: '0.5', height: '0.5' },
      })
      const viewComponentObject = mock.getViewComponent({
        children: [pageComponentObject],
      })

      // const ndomPage = ndom.createPage()
      // const nuiPage = ndomPage.getNuiPage()
      // ndomPage.viewport = viewport
      // nuiPage.use(() => [viewComponentObject])

      // const req = await ndom.request(ndomPage, 'Hello')

      // const components = (req && req.render()) as NUIComponent.Instance[]

      // const req = await request('Cereal')
      const view = req.render()
      const component = await render('Gold')
      console.info(component)
      let req = await ndom.request()

      const pageComponent = viewComponent.child()
      expect(isNUIPage(pageComponent.get('page'))).to.be.true
    })
  })
})
