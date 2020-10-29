import { expect } from 'chai'
import { NOODLComponent } from 'noodl-ui'
import { getByDataKey } from 'noodl-utils'
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
      expect(getByDataKey('formData.code')).to.exist
    })

    it('should be an image', () => {
      const path = 'abc.jpg'
      const src = noodlui.createSrc(path)
      const c = { type: 'image', path, dataKey: 'formData.phoneNumber' }
      toDOM(noodlui.resolveComponents(c))
      const node = getByDataKey('formData.phoneNumber')
      expect(node?.tagName).to.equal('IMAGE')
    })
  })

  describe('list', () => {
    it('should be in the dom', () => {
      const listObject = [] as any
      const c = { type: 'list', listObject, iteratorVar: 'apple' }
      const node = toDOM(noodlui.resolveComponents(c))
      console.info(prettyDOM())

      expect(document.querySelector('ul')).to.exist
    })
  })

  describe('listItem', () => {
    xit('should be in the dom', () => {
      //
    })
  })

  describe('textBoard', () => {
    xit('should render correctly', () => {
      const noodlComponent = {
        type: 'label',
        textBoard: [
          { text: 'Medical Records' },
          { br: null },
          { text: 'Upload an image or document' },
        ],
      } as NOODLComponent
      const component = noodl.resolveComponents(noodlComponent)
      const node = noodluidom.parse(component as any)
      document.body.appendChild(node as HTMLElement)
      console.info(prettyDOM())
      const children = node?.children as HTMLCollection
      expect(children[0].tagName).to.equal('LABEL')
      expect(children[1].tagName).to.equal('BR')
      expect(children[2].tagName).to.equal('LABEL')
      expect(screen.getByText('Medical Records')).to.exist
      expect(screen.getByText('Upload an image or document')).to.exist
    })
  })
})
