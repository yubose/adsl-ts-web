import { expect } from 'chai'
import { screen, waitFor } from '@testing-library/dom'
import { NOODLComponent } from 'noodl-ui'
import { assetsUrl, noodlui, page } from '../utils/test-utils'

describe('DOM', () => {
  describe('type: "textField" with contentType: "password"', () => {
    const dataKey = 'formData.greeting'
    const greeting = 'good morning'
    let eyeOpened = 'makePasswordVisiable.png'
    let eyeClosed = 'makePasswordInvisible.png'
    let regexTitlePwInvisible = /click here to reveal your password/i

    const noodlComponent = {
      type: 'textField',
      contentType: 'password',
      dataKey,
      placeholder: 'your password',
    } as NOODLComponent

    beforeEach(() => {
      noodlui
        .use({ getRoot: () => ({ formData: { greeting } }) })
        .setPage('SignIn')
    })

    it('should start off with hidden password mode for password inputs', async () => {
      page.render({
        type: 'view',
        children: [{ type: 'textField', contentType: 'password' }],
      })
      const input = await screen.findByTestId('password')
      expect(input).to.exist
      expect((input as HTMLInputElement).type).to.equal('password')
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
