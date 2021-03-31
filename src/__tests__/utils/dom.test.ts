import * as mock from 'noodl-ui-test-utils'
import userEvent from '@testing-library/user-event'
import { prettyDOM } from '@testing-library/dom'
import { expect } from 'chai'
import { coolGold, italic, magenta } from 'noodl-common'
import { createAction, createActionChain } from 'noodl-ui'
import { findByViewTag } from 'noodl-ui-dom'
import { onSelectFile } from '../../utils/dom'
import { createRender, getActions, getBuiltIns } from '../../utils/test-utils'

describe(coolGold(`dom (utils)`), () => {
  describe(italic(`hide`), () => {
    describe(`when the node to hide is relative (top is NiL)`, () => {
      it(
        `should set visibility to "visible", display to "none", and ` +
          `position to "relative"`,
        async () => {
          const viewTag = 'byeTag'
          const { nui, ndom, render } = createRender({
            components: [
              mock.getViewComponent({
                children: [
                  mock.getTextViewComponent({
                    viewTag,
                    style: { top: '0', display: 'block' },
                  }),
                  mock.getButtonComponent({
                    viewTag: 'btnTag',
                    onClick: [
                      mock.getBuiltInAction({ funcName: 'hide', viewTag }),
                    ],
                  }),
                ],
              }),
            ],
          })

          await render()
          const { hide, show } = getBuiltIns(['hide', 'show'])
          const vTagNode = findByViewTag(viewTag) as HTMLElement
          const btnNode = findByViewTag('btnTag') as HTMLElement
          expect(vTagNode.style.top).to.eq('0px')
          expect(vTagNode.style.visibility).to.eq('hidden')
          expect(vTagNode.style.display).to.eq('block')
          const ac = nui.createActionChain('onClick', [hide, show], {
            loadQueue: true,
          })
          await ac.execute()
          expect(vTagNode.style.display).to.eq('none')
          // console.info(prettyDOM())
        },
      )
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
