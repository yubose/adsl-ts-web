import { expect } from 'chai'
import { prettyDOM, waitFor } from '@testing-library/dom'
import * as u from '@jsmanifest/utils'
import * as mock from 'noodl-ui-test-utils'
import * as ncom from 'noodl-common'
import { isPage as isNUIPage, NUI, NUIComponent } from 'noodl-ui'
import isNDOMPage from '../utils/isPage'
import {
  createDataKeyReference,
  createRender as _createRender,
  ndom,
  _defaults,
  viewport,
} from '../test-utils'
import NDOM from '../noodl-ui-dom'
import {
  EmitObject,
  EmitObjectFold,
  PageComponentObject,
  PageObject,
  ViewComponentObject,
} from 'noodl-types'
import { findByClassName, findByElementId } from '../utils'

describe.only(ncom.coolGold('components'), () => {
  describe(ncom.italic(`Page`), () => {
    let Donut: PageObject
    let Cereal: PageObject
    let Hello: PageObject
    let viewComponentObject: ViewComponentObject
    let pageComponentObject: PageComponentObject
    let formData = { password: 'fruits' }
    let submitMessage = 'Press submit to proceed'

    beforeEach(() => {
      Donut = {
        formData,
        components: [
          mock.getTextFieldComponent({
            onChange: [
              mock.getFoldedEmitObject({
                dataKey: 'Donut.formData.password',
              }) as any,
            ],
          }),
        ],
      }
      Cereal = {
        submitMessage,
        components: [
          mock.getViewComponent({
            children: [
              mock.getImageComponent('abc.png'),
              mock.getLabelComponent({ dataKey: '..submitMessage' }),
              mock.getButtonComponent({ text: 'Submit' }),
            ],
          }),
        ],
      }
      Hello = {
        greeting: 'good morning',
        components: [
          {
            type: 'view',
            children: [
              mock.getTextFieldComponent({
                dataKey: 'Hello.greeting',
                placeholder: 'Say your greeting',
              } as any),
              mock.getButtonComponent({
                text: `Go to Donut page`,
                onCick: [mock.getGotoObject('Donut')],
              }),
              mock.getPageComponent({ path: 'Donut' }),
            ],
          },
        ],
      }
      pageComponentObject = mock.getPageComponent({
        type: 'page',
        path: { if: [true, '..thePageName', '..thePageName'] },
        style: { width: '0.5', height: '0.5' },
      })
      viewComponentObject = mock.getViewComponent({
        children: [pageComponentObject],
      })
    })

    function createRender(opts?: Parameters<typeof _createRender>[0]) {
      const renderer = _createRender({
        ...opts,
        root: { Cereal, Donut, Hello, ...opts?.root },
      })
      renderer.nui.use({
        getPages: () => u.keys(renderer.getRoot()),
      })
      return renderer
    }

    xit(`should create an NDOM page if it hasn't already been created`, () => {
      //
    })

    xit(`should return the same id as the associated NUIPage`, () => {
      //
    })

    xit(`should return the same page name as the associated NUIPage`, () => {
      //
    })

    it.only(`should be an iframe`, async () => {
      const { render } = createRender()
      const view = await render()
      const textField = view.child()
      const viewElem = findByElementId(view) as HTMLInputElement
      const inputElem = findByElementId(textField) as HTMLInputElement
      const buttonElem = inputElem.nextElementSibling as HTMLButtonElement
      const pageElem = buttonElem.nextElementSibling as HTMLIFrameElement
      await waitFor(() => {
        expect(pageElem).to.be.instanceOf(HTMLIFrameElement)
        // console.info(prettyDOM(pageElem))
      })
    })

    xit(`should render the component children to the DOM when received`, () => {
      //
    })

    xit(`should have the same pages in NDOM global as the amount of pages in the NUI page cache`, () => {
      //
    })

    xit(`should immediately re-render if its page name is set to a different one`, () => {
      //
    })

    xit(`should return all the component ids that are currently active in the DOM`, () => {
      //
    })

    xit(`should be in sync with the component cache`, () => {
      //
    })

    xit(`should receive the NUIPage instance on its 'page' prop in the resolve function`, async () => {
      const { render } = await createRender()
      const view = await render()
      await waitFor(() => {
        expect(view.child()).to.have.property('type', 'page')
        expect(view.child().get('page')).to.exist
        // expect(isNUIPage(view.child().get('page'))).to.be.true
      })
    })

    xit(`should set its rootNode to the node that is rendering`, () => {
      //
    })

    xit(`should eventually receive the page components`, () => {
      //
    })

    xit(`should not duplicate any children`, async () => {
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

    xit(`should update the root object which should also reflect in the root page`, async () => {
      const { getRoot, render: renderProp, nui } = await render((opts) => opts)
      nui.use({
        emit: {
          onChange: async () =>
            void (donutPageObject.formData.password = 'abc123'),
        },
        getPages: () => ['SignIn', 'Donut', 'Hello'],
      })
      const view = await renderProp()
      expect(getRoot().Donut.formData).to.have.property('password', 'fruits')
      const page = view.child()

      await waitFor(() => {
        const pageNode = findByElementId(page.id || '') as HTMLIFrameElement
        const pageChildren = pageNode?.contentDocument?.body
        expect(pageNode).to.exist
        expect(pageChildren).to.exist
        console.info(page.get('path'))
        // const input = pageChildrenNodes.item(0) as HTMLInputElement
        // expect(input).to.be.instanceOf(HTMLInputElement)
        // input.dispatchEvent(new Event('change'))
        // expect(donutPageObject.formData).to.have.property('password', 'abc123')
      })
      // await waitFor(() => {
      //   const input = pageChildrenNodes.item(0) as HTMLInputElement
      //   expect(input).to.be.instanceOf(HTMLInputElement)
      //   input.dispatchEvent(new Event('change'))
      //   expect(donutPageObject.formData).to.have.property('password', 'abc123')
      // })
    })
  })
})
