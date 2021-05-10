import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import * as lib from '.'
import {
  createActionWithKeyOrProps,
  createComponentWithKeyOrProps,
} from './utils'

describe(coolGold(`noodl-ui-test-utils`), () => {
  describe(italic('createActionWithKeyOrProps'), () => {
    //
  })

  describe(italic(`createComponentWithKeyOrProps`), () => {
    it(`should spread the props`, () => {
      const component = lib.getPopUpComponent({ global: true })
      expect(component).to.have.property('global', true)
      expect(component).to.have.property('popUpView', component.popUpView)
      console.log(component)
    })
  })
})
