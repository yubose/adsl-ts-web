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
import { PageObject, ViewComponentObject } from 'noodl-types'
import { findByClassName, findByElementId } from '../utils'

describe(ncom.coolGold('components'), () => {
  describe(ncom.italic(`Page`), () => {
    let donutPageObject: PageObject
    let viewComponentObject: ViewComponentObject

    beforeEach(() => {
      donutPageObject = {
        components: [
          mock.getTextFieldComponent({
            onChange: [
              mock.getFoldedEmitObject({
                dataKey: 'Donut.formData.password',
              }),
            ],
          }),
        ],
        formData: { password: 'fruits' },
      }
      Object.defineProperty(donutPageObject.formData, 'password', {
        configurable: true,
        enumerable: true,
        get value() {
          return donutPageObject.formData.password
        },
        set value(val) {
          donutPageObject.formData.password = val
        },
      })
      viewComponentObject = mock.getViewComponent({
        children: [
          mock.getPageComponent({
            type: 'page',
            path: 'Donut',
            style: { width: '0.5', height: '0.5' },
          }),
        ],
      })
    })

    async function render(
      opts?: Parameters<typeof createRender>[0],
    ): Promise<NUIComponent.Instance>

    async function render<RT = any>(
      fn?: (opts?: ReturnType<typeof createRender>) => RT,
    ): Promise<NonNullable<RT>>

    async function render<RT = any>(
      opts?:
        | Parameters<typeof createRender>[0]
        | ((opts?: ReturnType<typeof createRender>) => RT),
    ) {
      if (u.isFnc(opts)) {
        return opts(
          createRender({
            pageName: 'SignIn',
            root: {
              SignIn: { components: [viewComponentObject] },
              Donut: donutPageObject,
            },
          }),
        )
      }
      return createRender({
        pageName: 'SignIn',
        ...opts,
        root: {
          SignIn: { components: [viewComponentObject] },
          Donut: donutPageObject,
          ...opts?.root,
        },
      }).render()
    }

    it.only(`should become an iframe`, async () => {
      const view = await render()
      expect(findByElementId(view.child())).to.be.instanceOf(HTMLIFrameElement)
    })

    it(`should receive the NUIPage instance on its 'page' prop in the resolve function`, async () => {
      const view = await render()
      expect(isNUIPage(view.child().get('page'))).to.be.true
    })

    it(`should not duplicate any children`, async () => {
      const view = await render()
      const pageNode = findByElementId(view.child().id) as HTMLIFrameElement
      await waitFor(() => {
        const childrenList = Array.from(
          pageNode.contentDocument?.body.children as HTMLCollection,
        )
        expect(childrenList).to.have.length.greaterThan(0)
        expect(childrenList).to.have.length(1)
      })
    })

    it(`should update the root object which should also reflect in the root page`, async () => {
      const { getRoot, render: renderProp, nui } = await render((opts) => opts)
      nui.use({
        emit: {
          onChange: async () =>
            void (donutPageObject.formData.password = 'abc123'),
        },
      })
      const view = await renderProp()
      expect(getRoot().Donut.formData).to.have.property('password', 'fruits')
      const page = view.child()
      const pageNode = findByElementId(page.id || '') as HTMLIFrameElement
      const pageChildrenNodes = pageNode.contentDocument?.body
        .children as HTMLCollection

      await waitFor(() => {
        const input = pageChildrenNodes.item(0) as HTMLInputElement
        expect(input).to.be.instanceOf(HTMLInputElement)
        input.dispatchEvent(new Event('change'))
        expect(donutPageObject.formData).to.have.property('password', 'abc123')
      })
    })
  })
})
