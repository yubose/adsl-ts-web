import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import { createAction } from 'noodl-ui'
import { nui } from '../../utils/test-utils'
import * as mock from 'noodl-ui-test-utils'
import * as com from '../../utils/common'

describe(coolGold(`common (utils)`), () => {
  describe(`getActionMetadata`, () => {
    it.only(`should create subfields as { fromAction, fromComponent } if a component is provided`, () => {
      const component = nui.resolveComponents(
        mock.getButtonComponent({ viewTag: 'buttonTag', text: 'submit' }),
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
        mock.getButtonComponent({ viewTag: 'buttonTag', text: 'submit' }),
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
      const action = com.isPlainAction(mock.getBuiltInAction('redraw'))
      expect(action).to.be.true
    })

    it(`should return false for action instances`, () => {
      const action = createAction('onClick', mock.getBuiltInAction('redraw'))
      expect(com.isPlainAction(action)).to.be.false
    })
  })
})
