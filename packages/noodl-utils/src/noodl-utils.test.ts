import { expect } from 'chai'
import * as utils from '.'

describe('isAction', () => {
  it('should return true', () => {
    expect(utils.isAction({ actionType: 'hello' })).to.be.true
  })
  it('should return false', () => {
    expect(utils.isAction({ actiondasType: 'hello' })).to.be.false
  })
  it('should return true', () => {
    expect(utils.isAction({ goto: 'abc' })).to.be.true
  })
  it('should return false', () => {
    expect(utils.isAction('goto')).to.be.false
  })
})

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

describe('isComponentSelfStream', () => {
  it('', () => {
    //
  })
})
