import { expect } from 'chai'
import * as utils from '.'

describe('isBoolean', () => {
  it('should return true', () => {
    expect(utils.isBoolean(true)).to.be.true
  })
  it('should return true', () => {
    expect(utils.isBoolean('true')).to.be.true
  })
  it('should return true', () => {
    expect(utils.isBoolean(false)).to.be.true
  })
  it('should return true', () => {
    expect(utils.isBoolean('false')).to.be.true
  })
  it('should return false', () => {
    expect(utils.isBoolean('balse')).to.be.false
  })
})

describe('isSelfStreamComponent', () => {
  it('', () => {
    //
  })
})
