import { expect } from 'chai'
import sinon from 'sinon'
import Component from '../Component'
import NOODLUi from '../noodl-ui'
import Resolver from '../Resolver'
import { IComponent } from '../types'
import { createNOODLComponent } from '../utils/noodl'

let noodlui: NOODLUi

beforeEach(() => {
  noodlui = new NOODLUi()
})

describe('noodl-ui', () => {
  describe('Resolver', () => {
    it('should change the component attrs accordingly', () => {
      const r = new Resolver()
      r.setResolver((c, options) => {
        c.set('src', 'HELLO')
      })
      noodlui.use(r)
      const component = noodlui.resolveComponents({
        type: 'label',
        style: {},
        id: 'avc123',
      })
      const spy = sinon.spy()
      component.on('resolved', spy)
      console.info(spy.called)
    })
  })
  xit('should return the resolved components', () => {
    const component = createNOODLComponent('label', { style: {}, id: 'avc123' })
    const r = new Resolver()
    r.setResolver((c, options) => {
      c.set('src', 'HELLO')
    })
    noodlui.use(r)
    const resolvedComponent = noodlui.resolveComponents(component)
    expect(resolvedComponent).to.be.instanceOf(Component)
  })
})
