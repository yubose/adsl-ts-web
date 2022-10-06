import m from 'noodl-test-utils'
import * as u from '@jsmanifest/utils'
import userEvent from '@testing-library/user-event'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { findByViewTag, findFirstByViewTag } from 'noodl-ui'
import { createRender, getApp } from '../test-utils'
import * as d from '../../utils/dom'

describe(`dom (utils)`, () => {
  describe(`hide`, () => {
    xit(`should set the position to "relative" if top is auto (NiL)`, () => {
      //
    })

    xit(`should set the position to "absolute" if top has a value`, () => {
      //
    })

    it(`should set its visibility to "hidden"`, async () => {
      await getApp({
        navigate: true,
        components: [
          m.button({
            onClick: [m.builtIn({ funcName: 'hide' })],
            viewTag: 'hello',
          }),
        ],
      })
      const node = findFirstByViewTag('hello')
      expect(node.style).to.have.property('visibility', '')
      node.click()
      await waitFor(() =>
        expect(node.style).to.have.property('visibility', 'hidden'),
      )
    })

    describe(`when the node to hide is relative (top is NiL)`, async () => {
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
            m.view({
              children: [
                m.view({
                  children: [
                    m.view({
                      children: [
                        m.label({
                          viewTag,
                          display: 'block',
                          style: { height: '0.2', left: '0.1' },
                        }),
                      ],
                    }),
                  ],
                }),
                m.view({
                  children: [
                    m.textView({
                      viewTag: viewTag2,
                      style: { top: '0', display: 'block' },
                    }),
                    m.button({
                      viewTag: btnTag,
                      text: 'hello',
                      onClick: [m.builtIn({ funcName: 'hide', viewTag })],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      }

      for (const [key, val] of u.entries(hideKeyValues)) {
        xit(`should set ${key} to "${val}"`, async () => {
          const { nui, ndom, render } = getRender()
          const component = await render()
          const vTagNode = findByViewTag(viewTag) as HTMLElement
          const btnNode = findByViewTag(btnTag)
          findFirstByViewTag(btnTag)?.click()
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

  describe(`show`, () => {
    it(`should set its visibility to "visible"`, async () => {
      await getApp({
        navigate: true,
        components: [
          m.button({
            onClick: [m.builtIn({ funcName: 'show' })],
            id: 'hello',
          }),
        ],
      })
      const node = document.createElement('div')
      node.style.width = '200px'
      node.style.height = '100px'
      node.style.visibility = 'hidden'
      expect(node.style).to.have.property('visibility').not.to.eq('visible')
    })
  })

  describe(`${`openFileSelector`} (passing in an existing input)`, () => {
    xit('should be able to receive the image file and status: selected', async () => {
      const input = document.createElement('input')
      const result = await d.openFileSelector(input)
      const file = new File(['hello'], 'myFile.png', { type: 'image/png' })
      userEvent.upload(input, file)
      expect(input.files?.[0]).to.equal(file)
      expect(result.files?.[0]).to.equal(file)
      expect(result.status).to.equal('selected')
      expect(result.status).not.to.equal('canceled')
    })
  })
})
