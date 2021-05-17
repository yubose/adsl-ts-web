import * as mock from 'noodl-ui-test-utils'
import * as u from '@jsmanifest/utils'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { coolGold, italic, magenta, white } from 'noodl-common'
import { EcosDocComponentObject, EcosDocument, NameField } from 'noodl-types'
import { classes } from '../constants'
import NDOM from '../noodl-ui-dom'
import createEcosDocElement from '../utils/createEcosDocElement'
import { findBySelector, getFirstByElementId } from '../utils'
import { createRender } from '../test-utils'
import * as c from '../constants'

function getEcosDocComponentRenderResults<N extends NameField = NameField>({
  ecosObj = mock.getEcosDocObject() as EcosDocument<NameField>,
  component: componentProp = mock.getEcosDocComponent({
    id: 'hello',
    ecosObj,
  }),
  node = document.createElement('div'),
}: {
  component?: EcosDocComponentObject
  ecosObj?: EcosDocument<N>
  node?: HTMLElement
} = {}) {
  const component = NDOM._nui.resolveComponents(componentProp)
  node.id = component.id
  const iframe = createEcosDocElement(node, ecosObj)
  document.body.appendChild(node)
  return {
    componentObject: componentProp,
    component,
    ecosObj,
    node,
    iframe,
  }
}

describe(coolGold(`createEcosDocElement`), async () => {
  it(`should create an iframe element`, () => {
    const { iframe } = getEcosDocComponentRenderResults()
    expect(iframe).to.have.property('tagName', 'IFRAME')
    expect(iframe).to.be.instanceOf(HTMLIFrameElement)
  })

  it(
    `should not append the iframe to the node to let the parent decide ` +
      `when to append to its children instead`,
    async () => {
      const { iframe, node } = getEcosDocComponentRenderResults()
      expect(iframe.parentElement).not.to.exist
      expect(node.contains(iframe)).to.be.false
      node.appendChild(iframe)
      expect(iframe.parentElement).to.exist
      expect(node.contains(iframe)).not.to.be.false
    },
  )

  describe(italic('Rendering'), () => {
    describe(white(`image documents`), () => {
      it(`should render the image element into its body and set the src`, async () => {
        const customEcosObj = mock.getEcosDocObject({
          name: {
            data: 'blob:https://www.google.com/abc.png',
            type: 'image/png',
          },
          subtype: { mediaType: 4 },
        })
        const { iframe, node } = getEcosDocComponentRenderResults({
          component: mock.getEcosDocComponent({ ecosObj: customEcosObj }),
          ecosObj: customEcosObj,
        })
        node.appendChild(iframe)
        await waitFor(() => {
          const body = iframe.contentDocument?.body
          const bodyContent = body?.getElementsByClassName(
            classes.ECOS_DOC_IMAGE,
          )[0]
          expect(bodyContent).to.exist
          expect(bodyContent).to.have.property('tagName', 'IMG')
          expect(bodyContent).to.have.property('src', customEcosObj.name?.data)
        })
      })
    })

    xdescribe(white(`pdf documents`), () => {
      it(`should render the pdf element into its body and set the src`, async () => {
        const ecosObj = mock.getEcosDocObject('pdf')
        const { iframe, node } = getEcosDocComponentRenderResults({
          component: mock.getEcosDocComponent({ ecosObj }),
          ecosObj,
        })
        node.appendChild(iframe)
        await waitFor(() => {
          expect(ecosObj.name?.data).to.exist
          expect(iframe).to.have.property('src', ecosObj.name?.data)
        })
      })
    })

    describe(white(`text documents`), () => {
      xdescribe(white(`markdown`), () => {})

      describe(white(`plain text`), async () => {
        it(`should show the title and content`, async () => {
          const customEcosObj = mock.getEcosDocObject({
            name: {
              type: 'text/plain',
              title: 'my title',
              content: 'hello123',
            },
            subtype: {
              mediaType: 0,
            },
          })
          const { iframe, node } = getEcosDocComponentRenderResults({
            component: mock.getEcosDocComponent({ ecosObj: customEcosObj }),
            ecosObj: customEcosObj,
          })
          node.appendChild(iframe)
          await waitFor(() => {
            const body = iframe.contentDocument?.body
            const title = body?.getElementsByClassName(
              classes.ECOS_DOC_TEXT_TITLE,
            )[0]
            const content = body?.getElementsByClassName(
              classes.ECOS_DOC_TEXT_BODY,
            )[0]
            expect(title).to.exist
            expect(content).to.exist
            expect(body?.contains(title as HTMLElement)).to.be.true
            expect(body?.contains(content as HTMLElement)).to.be.true
            expect(title?.textContent).to.match(/my title/i)
            expect(content?.textContent).to.match(/hello123/i)
          })
        })
      })
    })
  })

  describe(italic(`Displaying`), () => {
    describe(white('note'), () => {
      it(`should only display the note's body content and not the title`, async () => {
        const component = await createRender({
          components: [mock.getEcosDocComponent('note')],
        }).render()
        const node = getFirstByElementId(component)
        const iframe = node.firstElementChild as HTMLIFrameElement
        await waitFor(() => {
          const body = iframe.contentDocument?.body as HTMLBodyElement
          const titleNode = body.getElementsByClassName(
            c.classes.ECOS_DOC_TEXT_TITLE,
          )[0]
          const descNode = body.getElementsByClassName(
            c.classes.ECOS_DOC_NOTE_DATA,
          )[0]
          expect(titleNode).not.to.exist
          expect(descNode).to.exist
        })
      })
    })
  })
})
