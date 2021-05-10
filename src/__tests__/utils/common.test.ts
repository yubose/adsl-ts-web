import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import { createAction } from 'noodl-ui'
import * as mock from 'noodl-ui-test-utils'
import * as com from '../../utils/common'

describe(coolGold(`common (utils)`), () => {
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
