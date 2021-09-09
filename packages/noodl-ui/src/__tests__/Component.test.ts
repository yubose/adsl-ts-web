import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import Component from '../components/Base'

describe(coolGold('Component'), () => {
  describe(italic('Instantiating'), () => {
    it(`should set the original component as the blueprint`, () => {
      const obj = { type: 'view' }
      const component = new Component(obj)
      expect(component).to.have.property('blueprint').eq(obj)
    })

    it(`should assign an id`, () => {
      expect(new Component({ type: 'view' })).to.have.property('id').to.exist
    })

    it(`should set the component type property`, () => {
      expect(new Component({ type: 'view' }))
        .to.have.property('type')
        .eq('view')
    })
  })
})
