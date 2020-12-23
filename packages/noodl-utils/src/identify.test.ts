import { expect } from 'chai'
import * as n from '.'

describe('identify', () => {
  describe('isAction', () => {
    xit('should return true if it has a "goto" property', () => {
      //
    })

    xit('should return true if it has an "emit" property', () => {
      //
    })

    xit('should return true if it has an "actionType" property', () => {
      //
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

    it('should return true', () => {
      expect(n.isBreakLineTextBoardItem({ br: undefined })).to.be.true
    })

    it('should return true', () => {
      expect(n.isBreakLineTextBoardItem('br')).to.be.true
    })
  })

  describe('isComponent', () => {
    it(
      'should return true if the type matches anything in the official list' +
        'of component types',
      () => {
        //
      },
    )

    it('should automatically return false if the value isnt an object type', () => {
      //
    })
  })

  describe('isEmitObj', () => {
    it('', () => {
      //
    })
  })

  describe('isIfObj', () => {
    it('', () => {
      //
    })
  })

  describe('isPluginComponent', () => {
    it('', () => {
      //
    })
  })

  describe('isPossiblyDataKey', () => {
    it('', () => {
      //
    })
  })

  describe('isReference', () => {
    it('', () => {
      //
    })
  })
})
