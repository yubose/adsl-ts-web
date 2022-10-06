import { expect } from 'chai'
import { createAction } from 'noodl-ui'
import { nui } from '../test-utils'
import m from 'noodl-test-utils'
import * as com from '../../utils/common'

describe(`common (utils)`, () => {
  describe(`getActionMetadata`, () => {
    it(`should create subfields as { fromAction, fromComponent } if a component is provided`, () => {
      const component = nui.resolveComponents(
        m.button({ viewTag: 'buttonTag', text: 'submit' }),
      )
      const ac = nui.createActionChain(
        'onClick',
        { actionType: 'builtIn', funcName: 'redraw', viewTag: 'buttonTag' },
        { component, loadQueue: true },
      )
      const metadata = com.getActionMetadata(ac.queue[0], {
        component,
        pickKeys: 'viewTag',
      })
      expect(metadata).to.have.property('viewTag')
      expect(metadata.viewTag).to.have.property('fromAction').eq('buttonTag')
      expect(metadata.viewTag).to.have.property('fromComponent').eq('buttonTag')
    })

    xit(`should create subfields as { [pickKey[number]]: any } if a component is NOT provided`, () => {
      const component = nui.resolveComponents(
        m.button({ viewTag: 'buttonTag', text: 'submit' }),
      )
      const ac = nui.createActionChain(
        'onClick',
        { actionType: 'builtIn', funcName: 'redraw', viewTag: 'buttonTag' },
        { component, loadQueue: true },
      )
      const metadata = com.getActionMetadata(ac.queue[0], {
        pickKeys: 'viewTag',
      })
      expect(metadata).to.have.property('viewTag')
      // expect(metadata.viewTag.not).to.have.property('fromAction')
      // expect(metadata.viewTag.not).to.have.property('fromComponent')
    })

    xit(`should have a property "action" as { instance, object }`, () => {
      //
    })
  })

  describe(`isPlainAction`, () => {
    it(`should return true for action objects`, () => {
      const action = com.isPlainAction(m.builtIn('redraw'))
      expect(action).to.be.true
    })

    it(`should return false for action instances`, () => {
      const action = createAction('onClick', m.builtIn('redraw'))
      expect(com.isPlainAction(action)).to.be.false
    })
  })
})
