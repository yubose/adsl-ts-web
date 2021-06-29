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
import { ViewComponentObject } from 'noodl-types'
import { findByClassName, findByElementId } from '../utils'
import { classes } from '../constants'

describe(ncom.coolGold('components'), () => {
  describe(ncom.italic(`Page`), () => {
    let viewComponentObject: ViewComponentObject

    beforeEach(() => {
      viewComponentObject = mock.getViewComponent({
        children: [
          mock.getPageComponent({
            type: 'page',
            path: 'Cereal',
            style: { width: '0.5', height: '0.5' },
          }),
        ],
      })
    })

    it(`should receive the NUIPage instance on its 'page' prop in the resolve function`, async () => {
      const { render, ndom, page, pageObject, getRoot } = createRender({
        // pageName: 'SignIn',
        pageObject: { components: [viewComponentObject] },
      })
      const view = await render()
      const pageComponent = view.child()
      const pageNode = findByElementId(pageComponent.id) as HTMLIFrameElement
      expect(isNUIPage(pageComponent.get('page'))).to.be.true
      await waitFor(() => {
        expect(pageNode?.contentDocument?.body).to.exist
        expect(
          Array.from(pageNode.contentDocument?.body.children || []),
        ).to.have.length.greaterThan(0)
      })
    })

    xit(`should render it to the DOM`, async () => {
      const { render } = createRender({
        root: {
          SignIn: { components: [viewComponentObject] },
          Cereal: {
            components: [
              mock.getButtonComponent({
                viewTag: 'hello',
                onClick: [mock.getFoldedEmitObject()],
              }),
            ],
          },
        },
      })
      await render()
      const view = await render('Cereal')
      const pageComponent = view.child()

      // console.info(view)
      // const ndomPage = ndom.createPage()
      // const nuiPage = ndomPage.getNuiPage()
      // ndomPage.viewport = viewport
      // nuiPage.use(() => [viewComponentObject])
      // const req = await ndom.request(ndomPage, 'Hello')
      // const components = (req && req.render()) as NUIComponent.Instance[]
      // const req = await request('Cereal')
    })

    xit(`should update the root object which should also reflect in the root page`, () => {
      //
    })

    xit(`should have the same width/size and positioning as defined in the component style`, () => {
      //
    })
  })
})
