import * as mock from 'noodl-ui-test-utils'
import sinon from 'sinon'
import { prettyDOM } from '@testing-library/dom'
import { expect } from 'chai'
import { screen, waitFor } from '@testing-library/dom'
import { getFirstByElementId } from 'noodl-ui-dom'
import { coolGold, italic, magenta } from 'noodl-common'
import { assetsUrl, createRender, initializeApp } from '../utils/test-utils'
import getMockParticipant from './helpers/getMockParticipant'
import getVideoChatPageObject from './helpers/getVideoChatPage'

const getApp = async ({
  room,
  navigate = true,
  pageName = 'VideoChat',
  participants = [],
}: Partial<Parameters<typeof initializeApp>[0]> & {
  navigate?: boolean
  participants?: any[]
} = {}) => {
  const app = await initializeApp({
    pageName,
    pageObject: getVideoChatPageObject({ participants }),
    room: { state: 'connected', ...room },
  })
  if (navigate) await app.navigate(pageName)
  return app
}

describe(coolGold('DOM'), () => {
  describe(`when navigating to VideoChat (the first time)`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`when navigating back to VideoChat`, () => {
    describe(`when ${italic(`reload: false`)} is used`, () => {
      xit(``, () => {
        //
      })
    })
  })

  describe(`when navigating away from VideoChat`, () => {
    xit(``, () => {
      //
    })
  })

  xit(`should display the resolved data-value for a dataValue emit`, async () => {
    const email = 'abc@gmail.com'
    const value = 'myval123'
    const { ndom, render } = createRender({
      pageObject: {
        formData: { email },
        components: [
          mock.getTextFieldComponent({
            id: 't',
            dataValue: [
              mock.getEmitObject({
                dataKey: { var1: `formData.email` },
                actions: [],
              }),
            ],
          }),
        ],
      },
    })
    const spy = sinon.spy(async () => value)
    ndom.use({
      action: {
        emit: [
          {
            fn: spy,
            trigger: 'dataValue',
          },
        ],
      },
    })
    await render()
    const node = getFirstByElementId('t') as HTMLInputElement
    console.info(node)
    await waitFor(() => {
      expect(node.dataset.value).to.eq(value)
      expect(node.value).to.eq(value)
    })
  })

  xdescribe(italic(`textField (password)`), () => {
    const dataKey = 'formData.greeting'
    let eyeOpened = 'makePasswordVisiable.png'
    let eyeClosed = 'makePasswordInvisible.png'
    let regexTitlePwInvisible = /click here to reveal your password/i

    const getPasswordTextField = () => ({
      type: 'textField',
      id: 'password',
      contentType: 'password',
      dataKey,
      placeholder: 'your password',
    })

    it('should start off with hidden password mode for password inputs', async () => {
      const { render } = createRender({
        components: [
          mock.getViewComponent({ children: [getPasswordTextField()] }),
        ],
      })
      const component = await render()
      const node = getFirstByElementId('password') as HTMLInputElement
      expect(node).to.exist
      await waitFor(() => {
        expect(node.type).to.equal('password')
      })
    })

    it('should start off showing the eye closed icon', async () => {
      page.render(noodlComponent)
      await waitFor(() => {
        const img = document.getElementsByTagName('img')[0]
        expect(img.getAttribute('src')).to.eq(assetsUrl + eyeClosed)
      })
    })

    it('should flip the eye icon to open when clicked', async () => {
      page.render(noodlComponent)
      const eyeContainer = await screen.findByTitle(regexTitlePwInvisible)
      let img = document.querySelector('img')
      expect(img).to.exist
      expect(img?.getAttribute('src')).not.to.eq(assetsUrl + eyeOpened)
      await waitFor(() => {
        img = document.querySelector('img')
        expect(img?.getAttribute('src')).to.eq(assetsUrl + eyeClosed)
      })
      expect(eyeContainer).to.exist
      eyeContainer.click()
      img?.click()
    })
  })
})
