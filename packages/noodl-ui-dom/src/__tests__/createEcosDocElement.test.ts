import * as mock from 'noodl-ui-test-utils'
import * as u from '@jsmanifest/utils'
import { NUIComponent } from 'noodl-ui'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { coolGold, italic, magenta, white } from 'noodl-common'
import {
  ComponentObject,
  EcosDocComponentObject,
  EcosDocument,
  NameField,
} from 'noodl-types'
import { classes } from '../constants'
import createEcosDocElement from '../utils/createEcosDocElement'
import { getFirstByElementId } from '../utils'
import { nui } from '../nui'
import { createRender, createDataKeyReference, ndom } from '../test-utils'
import * as c from '../constants'

function getEcosDocElement(
  componentObject:
    | NUIComponent.Instance
    | ComponentObject
    | undefined
    | null = mock.getEcosDocComponent(),
  container = document.body,
) {
  const node = createEcosDocElement(
    container,
    u.isFnc(componentObject?.get)
      ? componentObject?.get('ecosObj')
      : componentObject?.['ecosObj'],
  ) as HTMLIFrameElement
  return node
}

function getEcosDocRenderResults<N extends NameField = NameField>({
  ecosObj = mock.getEcosDocObject(),
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
  const component = nui.resolveComponents(componentProp)
  node.id = component.id
  const iframe = getEcosDocElement(component)
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
    const iframe = getEcosDocElement()
    expect(iframe).to.have.property('tagName', 'IFRAME')
    expect(iframe).to.be.instanceOf(HTMLIFrameElement)
  })

  it(
    `should not append the iframe to the node so that the parent can decide ` +
      `when to append to its children instead`,
    async () => {
      const { iframe, node } = getEcosDocRenderResults()
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
        const componentObject = mock.getEcosDocComponent({
          ecosObj: customEcosObj,
        })
        const iframe = getEcosDocElement(componentObject)
        document.body.appendChild(iframe)
        await waitFor(() => {
          const body = iframe.contentDocument?.body
          expect(body?.classList.contains(c.classes.ECOS_DOC_IMAGE)).to.be.true
          expect(body?.querySelector('img')).to.exist
          expect(body?.querySelector('img')).to.have.property(
            'src',
            customEcosObj.name?.data,
          )
        })
      })
    })

    xdescribe(white(`pdf documents`), () => {
      it(`should render the pdf element into its body and set the src`, async () => {
        const ecosObj = mock.getEcosDocObject('pdf')
        const { iframe, node } = getEcosDocRenderResults({
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
          const { iframe, node } = getEcosDocRenderResults({
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

  describe(italic(`Classes`), () => {
    it(`should attach the class name "${c.classes.ECOS_DOC}" on the iframe`, async () => {
      expect(getEcosDocElement().classList.contains(c.classes.ECOS_DOC)).to.be
        .true
    })

    describe(white(`image`), () => {
      it(`should attach the class name "${c.classes.ECOS_DOC_IMAGE}"`, async () => {
        const iframe = getEcosDocElement(mock.getEcosDocComponent('image'))
        document.body.appendChild(iframe)
        await waitFor(() => {
          expect(
            iframe.contentDocument?.body?.classList.contains(
              c.classes.ECOS_DOC_IMAGE,
            ),
          ).to.be.true
        })
      })
    })

    describe(white(`note`), () => {
      xit(
        `should attach the class name "${c.classes.ECOS_DOC_NOTE_TITLE}" on ` +
          `note title elements that explicitly reference it`,
        async () => {
          const ecosObj = mock.getEcosDocObject('note')
          // @ts-expect-error
          ecosObj.name.title = `SignIn.gender.key`
          const components = [{ ...mock.getEcosDocComponent({ ecosObj }) }]
          const { render } = createRender({ components })
          createDataKeyReference({
            pageName: 'SignIn',
            pageObject: { gender: { key: 'hello123' }, components },
          })
          const component = await render()
          const node = getFirstByElementId(component)
          await waitFor(() => {
            const titleElem = node.getElementsByClassName(
              c.classes.ECOS_DOC_NOTE_TITLE,
            )[0]
            expect(node).to.exist
            expect(titleElem).to.exist
          })
        },
      )

      it(
        `should attach the class name "${c.classes.ECOS_DOC_NOTE}" on note ` +
          `elements`,
        async () => {
          let iframe: HTMLIFrameElement
          document.body.appendChild(
            (iframe = getEcosDocElement(mock.getEcosDocComponent('note'))),
          )
          await waitFor(() => {
            expect(
              iframe.contentDocument?.getElementsByClassName(
                c.classes.ECOS_DOC_NOTE,
              )[0],
            ).to.exist
          })
        },
      )

      it(
        `should attach the class name "${c.classes.ECOS_DOC_NOTE_DATA}" on ` +
          `note body elements`,
        async () => {
          let iframe: HTMLIFrameElement
          document.body.appendChild(
            (iframe = getEcosDocElement(mock.getEcosDocComponent('note'))),
          )
          await waitFor(() => {
            expect(
              iframe.contentDocument?.getElementsByClassName(
                c.classes.ECOS_DOC_NOTE_DATA,
              )[0],
            ).to.exist
          })
        },
      )
    })

    describe(white(`pdf`), () => {
      it(
        `should attach the class name "${c.classes.ECOS_DOC_PDF}" on ` +
          `the iframe`,
        async () => {
          let iframe: HTMLIFrameElement
          document.body.appendChild(
            (iframe = getEcosDocElement(mock.getEcosDocComponent('pdf'))),
          )
          await waitFor(() => {
            expect(iframe.classList.contains(c.classes.ECOS_DOC_PDF)).to.be.true
          })
        },
      )
    })
  })
})
