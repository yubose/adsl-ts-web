import { expect } from 'chai'
import { getByText, prettyDOM, screen } from '@testing-library/dom'
import { noodl, noodluidom } from '../utils/test-utils'
import { NOODLComponent } from 'noodl-ui'

describe('DOM', () => {
  describe('textBoard', () => {
    it('should render correctly', () => {
      const noodlComponent = {
        type: 'label',
        textBoard: [
          { text: 'Medical Records' },
          { br: null },
          { text: 'Upload an image or document' },
        ],
      } as NOODLComponent
      const component = noodl.resolveComponents(noodlComponent)[0]
      const node = noodluidom.parse(component as any)
      document.body.appendChild(node as HTMLElement)
      const children = node?.children as HTMLCollection
      expect(children[0].tagName).to.equal('LABEL')
      expect(children[1].tagName).to.equal('BR')
      expect(children[2].tagName).to.equal('LABEL')
      expect(screen.getByText('Medical Records')).to.exist
      expect(screen.getByText('Upload an image or document')).to.exist
    })
  })
})
