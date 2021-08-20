import { expect } from 'chai'
import * as nc from 'noodl-common'
import * as lib from './noodl-ui-test-utils'

describe(nc.coolGold(`noodl-ui-test-utils`), () => {
  describe(nc.italic('createActionObject'), () => {
    //
  })

  describe(nc.italic(`createComponent`), () => {
    it(`should spread the props`, () => {
      const component = lib.getPopUpComponent({ global: true })
      expect(component).to.have.property('global', true)
      expect(component).to.have.property('popUpView', component.popUpView)
      console.log(component)
    })
  })

  describe(nc.italic('getBuiltInAction'), () => {
    it(`should set actionType and funcName by default`, () => {
      const builtIn = lib.getBuiltInAction()
      expect(builtIn).to.have.property('actionType', 'builtIn')
      expect(builtIn).to.have.property('funcName').to.exist

      console.log(lib.getEvalObjectAction({ object: 'fsaf' }))
    })
  })
})
