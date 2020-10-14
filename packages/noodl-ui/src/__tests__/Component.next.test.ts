import { expect } from 'chai'
import Component from '../Component'

describe('Component', () => {
  it('should return values by getter', () => {
    const component = new Component({
      type: 'label',
      text: 'submit',
      style: { width: '0.2' },
      path: 'https://www.google.com/abc.jpg',
    })
    expect(component.type).to.equal('label')
    expect(component.text).to.equal('submit')
  })
})
