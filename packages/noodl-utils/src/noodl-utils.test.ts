import { expect } from 'chai'
import * as n from '.'

describe('isAction', () => {
  it('should return true', () => {
    expect(n.isAction({ actionType: 'hello' })).to.be.true
  })
  it('should return false', () => {
    expect(n.isAction({ actiondasType: 'hello' })).to.be.false
  })
  it('should return true', () => {
    expect(n.isAction({ goto: 'abc' })).to.be.true
  })
  it('should return false', () => {
    expect(n.isAction('goto')).to.be.false
  })
})

describe('isBoolean', () => {
  it('should return true', () => {
    expect(n.isBoolean(true)).to.be.true
  })
  it('should return true', () => {
    expect(n.isBoolean('true')).to.be.true
  })
  it('should return true', () => {
    expect(n.isBoolean(false)).to.be.true
  })
  it('should return true', () => {
    expect(n.isBoolean('false')).to.be.true
  })
  it('should return false', () => {
    expect(n.isBoolean('balse')).to.be.false
  })
})

describe('isBreakLineTextBoardItem', () => {
  it('should return false', () => {
    expect(n.isBreakLineTextBoardItem({ text: 'hello' })).to.be.false
  })
  xit('should return true', () => {
    expect(n.isBreakLineTextBoardItem({ br: undefined })).to.be.true
  })
  xit('should return true', () => {
    expect(n.isBreakLineTextBoardItem('br')).to.be.true
  })
})

describe('isComponentSelfStream', () => {
  it('', () => {
    //
  })
})
