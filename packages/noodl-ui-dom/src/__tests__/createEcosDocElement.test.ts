import * as u from '@jsmanifest/utils'
import { NuiComponent } from 'noodl-ui'
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
import { createRender, createDataKeyReference, ndom, ui } from '../test-utils'
import * as c from '../constants'

async function getEcosDocLoadResult(
  componentObject:
    | NuiComponent.Instance
    | ComponentObject
    | undefined
    | null = ui.ecosDocComponent(),
  container = document.body,
) {
  return createEcosDocElement(
    container,
    u.isFnc(componentObject?.get)
      ? componentObject?.get('ecosObj')
      : componentObject?.['ecosObj'],
  )
}

async function getEcosDocRenderResults<N extends NameField = NameField>({
  ecosObj = ui.ecosDoc(),
  component: componentProp = ui.ecosDocComponent({
    id: 'hello',
    ecosObj,
  }),
  node = document.createElement('div'),
}: {
  component?: EcosDocComponentObject
  ecosObj?: EcosDocument<N>
  node?: HTMLElement
} = {}) {
  const component = await nui.resolveComponents(componentProp)
  node.id = component.id
  const { iframe } = await getEcosDocLoadResult(component)
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
  it(`should create an iframe element`, async () => {
    const { iframe } = await getEcosDocLoadResult()
    expect(iframe).to.have.property('tagName', 'IFRAME')
    expect(iframe).to.be.instanceOf(HTMLIFrameElement)
  })

  describe(italic('Rendering'), () => {
    describe(white(`image documents`), () => {
      it(`should render the image element into its body and set the src`, async () => {
        const customEcosObj = ui.ecosDoc({
          name: {
            data: 'blob:https://www.google.com/abc.png',
          },
          subtype: { mediaType: 4 },
        })
        const componentObject = ui.ecosDocComponent({
          ecosObj: customEcosObj,
        })
        const { iframe } = await getEcosDocLoadResult(componentObject)
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

    describe(white(`pdf documents`), () => {
      it(`should render the pdf element into its body and set the src`, async () => {
        const ecosObj = ui.ecosDoc('pdf')
        const { iframe } = await getEcosDocRenderResults({
          component: ui.ecosDocComponent({ ecosObj }),
          ecosObj,
          node: document.body,
        })
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
          const customEcosObj = ui.ecosDoc({
            name: {
              type: 'text/plain',
              title: 'my title',
              content: 'hello123',
            },
            subtype: {
              mediaType: 0,
            },
          })
          const { iframe, node } = await getEcosDocRenderResults({
            component: ui.ecosDocComponent({ ecosObj: customEcosObj }),
            ecosObj: customEcosObj,
          })
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
      expect(
        (await getEcosDocLoadResult()).iframe.classList.contains(
          c.classes.ECOS_DOC,
        ),
      ).to.be.true
    })

    describe(white(`image`), () => {
      it(`should attach the class name "${c.classes.ECOS_DOC_IMAGE}"`, async () => {
        const { iframe } = await getEcosDocLoadResult(
          ui.ecosDocComponent('image'),
        )
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
          const ecosObj = ui.ecosDoc('note')
          ecosObj.name.title = `SignIn.gender.key`
          const components = [{ ...ui.ecosDocComponent({ ecosObj }) }]
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
          iframe = (
            await getEcosDocLoadResult(
              ui.ecosDocComponent('note'),
              document.body,
            )
          ).iframe
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
          let loadResult = await getEcosDocLoadResult(
            ui.ecosDocComponent('note'),
            document.body,
          )
          await waitFor(() => {
            expect(
              loadResult.iframe.contentDocument?.getElementsByClassName(
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
          let loadResult = await getEcosDocLoadResult(
            ui.ecosDocComponent('pdf'),
            document.body,
          )
          await waitFor(() => {
            expect(loadResult.iframe.classList.contains(c.classes.ECOS_DOC_PDF))
              .to.be.true
          })
        },
      )
    })
  })
})
