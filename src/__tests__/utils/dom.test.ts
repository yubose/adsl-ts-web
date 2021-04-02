import * as mock from 'noodl-ui-test-utils'
import userEvent from '@testing-library/user-event'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { coolGold, italic, magenta } from 'noodl-common'
import { findByViewTag } from 'noodl-ui-dom'
import { createRender, getActions, getBuiltIns } from '../../utils/test-utils'
import { onSelectFile } from '../../utils/dom'
import * as u from '../../utils/common'

describe(coolGold(`dom (utils)`), () => {
  describe(italic(`hide`), () => {
    xit(`should set the position to "relative" if top is auto (NiL)`, () => {
      //
    })

    xit(`should set the position to "absolute" if top has a value`, () => {
      //
    })

    xdescribe(`when the node to hide is relative (top is NiL)`, async () => {
      const hideKeyValues = {
        visibility: 'hidden',
        display: 'none',
        position: 'relative',
      } as const

      const viewTag = 'fireTag'
      const viewTag2 = 'waterTag'
      const btnTag = 'btnTag'

      const getRender = () => {
        return createRender({
          components: [
            mock.getViewComponent({
              children: [
                mock.getViewComponent({
                  children: [
                    mock.getViewComponent({
                      children: [
                        mock.getLabelComponent({
                          viewTag,
                          display: 'block',
                          style: { height: '0.2', left: '0.1' },
                        }),
                      ],
                    }),
                  ],
                }),
                mock.getViewComponent({
                  children: [
                    mock.getTextViewComponent({
                      viewTag: viewTag2,
                      style: { top: '0', display: 'block' },
                    }),
                    mock.getButtonComponent({
                      viewTag: btnTag,
                      text: 'hello',
                      onClick: [
                        mock.getBuiltInAction({ funcName: 'hide', viewTag }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      }

      it(`should set its display to "none"`, async () => {
        const { nui, ndom, render } = getRender()
        const { hide, show } = getBuiltIns(['hide', 'show'])
        const component = await render()
        const vTagNode = findByViewTag(viewTag) as HTMLElement
        const btnNode = findByViewTag(btnTag)
        console.info(prettyDOM())
        expect(vTagNode.style.display).not.to.eq('none')
        btnNode?.click()
        await waitFor(() => {
          expect(vTagNode.style.display).to.eq('none')
        })
      })

      for (const [key, val] of u.entries(hideKeyValues)) {
        xit(`should set ${key} to "${val}"`, async () => {
          const { nui, ndom, render } = getRender()
          const { hide, show } = getBuiltIns(['hide', 'show'])
          const component = await render()
          const vTagNode = findByViewTag(viewTag) as HTMLElement
          const btnNode = findByViewTag(btnTag)
          console.info(prettyDOM(btnNode))

          findByViewTag(btnTag)?.click()
          await waitFor(() => {
            expect(vTagNode.style[key as any]).to.eq(val)
          })
          // expect(vTagNode.style[key as any]).to.eq(val)

          // const ac = nui.createActionChain('onClick', [hide, show], {
          //   loadQueue: true,
          // })
          // await ac.execute()
          // expect(vTagNode.style.display).to.eq('none')
          // console.info(prettyDOM())
        })
      }

      xit(`should set all of the following siblings to relative`, () => {
        //
      })
    })

    describe(`when the node to hide is absolute (top exists)`, () => {
      xit(``, () => {
        //
      })
    })
  })

  describe(italic(`show`), () => {
    xit(``, () => {
      //
    })
  })

  describe(`${italic(`onSelectFile`)} (passing in an existing input)`, () => {
    xit('should be able to receive the image file and status: selected', async () => {
      const input = document.createElement('input')
      const result = await onSelectFile(input)
      const file = new File(['hello'], 'myFile.png', { type: 'image/png' })
      userEvent.upload(input, file)
      expect(input.files?.[0]).to.equal(file)
      expect(result.files?.[0]).to.equal(file)
      expect(result.status).to.equal('selected')
      expect(result.status).not.to.equal('canceled')
    })
  })
})
