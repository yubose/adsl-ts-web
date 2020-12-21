import { expect } from 'chai'
import { noodlui } from '../../utils/test-utils'
import { _resolveChildren } from './helpers'

describe('helpers', () => {
  describe('_resolveChildren', () => {
    it('should call the callback on each resolved child', () => {
      const encounteredChildren = [] as any[]
      const noodlComponent = {
        type: 'view',
        children: [
          { type: 'view', children: [{ type: 'label', dataKey: 'greeting' }] },
          { type: 'label', dataKey: 'formData.greeting' },
          { type: 'image', dataKey: 'abc.png' },
        ],
      } as any
      const component = noodlui.resolveComponents(noodlComponent)
      _resolveChildren(component, {
        onResolve: (c) => encounteredChildren.push(c),
        resolveComponent: noodlui.getConsumerOptions({ component })
          .resolveComponent,
      })
      expect(encounteredChildren).to.have.lengthOf(3)
    })
  })
})
