import { expect } from 'chai'
// import {} from 'noodl-ui'
import { screen, prettyDOM } from '@testing-library/dom'
import { noodlui, noodluidom, toDOM } from '../utils/test-utils'

describe('DOM', () => {
  describe('button', () => {
    it('should be in the DOM', () => {
      const c = { type: 'button', text: 'hello' }
      const component = noodlui.resolveComponents(c)
      toDOM(component)
      expect(screen.getByText('hello')).to.exist
    })
  })

  describe('image', () => {
    it('should be in the dom', () => {
      const path = 'abc.jpg'
      const c = { type: 'image', path, dataKey: 'formData.avatar' }
      const component = noodlui.resolveComponents(c)
      toDOM(component)
      const img = document.getElementsByTagName('img')[0]
      expect(img).to.exist
      expect(img.dataset.key).to.equal('formData.avatar')
    })

    it('should have the src', () => {
      const path = 'abc.jpg'
      const src = noodlui.createSrc(path)
      const c = { type: 'image', path, dataKey: 'formData.phoneNumber' }
      toDOM(noodlui.resolveComponents(c))
      expect(document.querySelector(`img`)?.getAttribute('src')).to.equal(src)
    })
  })

  describe('list', () => {
    it('should be in the dom', () => {
      const listObject = [] as any
      const c = { type: 'list', listObject, iteratorVar: 'apple' }
      const node = toDOM(noodlui.resolveComponents(c))
      expect(document.querySelector('ul')).to.exist
    })
  })

  describe('listItem', () => {
    it('should be in the dom', () => {
      const c = { type: 'listItem', iteratorVar: 'apple' }
      toDOM(noodlui.resolveComponents(c))
      expect(document.querySelector('li')).to.exist
    })
  })

  describe('textBoard', () => {
    it('should be in the correct form in the DOM', () => {
      const noodlComponent = {
        type: 'label',
        textBoard: [
          { text: 'Medical Records' },
          { br: null },
          { text: 'Upload an image or document' },
        ],
      } as NOODLComponent
      const node = toDOM(noodlui.resolveComponents(noodlComponent))
      const children = node?.children as HTMLCollection
      expect(children[0].tagName).to.equal('LABEL')
      expect(children[1].tagName).to.equal('BR')
      expect(children[2].tagName).to.equal('LABEL')
      expect(screen.getByText('Medical Records')).to.exist
      expect(screen.getByText('Upload an image or document')).to.exist
    })
  })
})
