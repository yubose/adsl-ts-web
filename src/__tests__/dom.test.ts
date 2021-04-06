import * as mock from 'noodl-ui-test-utils'
import sinon from 'sinon'
import { expect } from 'chai'
import { screen, waitFor } from '@testing-library/dom'
import { getFirstByElementId } from 'noodl-ui-dom'
import { coolGold, italic, magenta } from 'noodl-common'
import { assetsUrl, createRender } from '../utils/test-utils'

describe(coolGold('DOM'), () => {
  it.only(`should display the resolved data-value for a dataValue emit`, async () => {
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
