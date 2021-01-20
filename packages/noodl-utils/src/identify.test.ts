import { expect } from 'chai'
import { componentTypes } from './constants'
import * as n from '.'

describe('identify', () => {
  describe('isAction', () => {
    it('should return true if it has a "goto" property', () => {
      expect(n.isAction({ goto: 'SignIn' })).to.be.true
    })
    it('should return true if it is an emit object', () => {
      expect(n.isAction({ emit: { dataKey: { var1: 'hello' }, actions: [] } }))
        .to.be.true
    })
    it('should return true if it has an "actionType" property', () => {
      expect(n.isAction({ actionType: 'abc123' })).to.be.true
    })
  })

  describe('isBoolean', () => {
    it('should return true', () => expect(n.isBoolean(true)).to.be.true)
    it('should return true', () => expect(n.isBoolean('true')).to.be.true)
    it('should return true', () => expect(n.isBoolean(false)).to.be.true)
    it('should return true', () => expect(n.isBoolean('false')).to.be.true)
    it('should return false', () => expect(n.isBoolean('balse')).to.be.false)
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
    componentTypes.forEach((type) => {
      it(`should return true if it has a "type" property that is in the components list`, () => {
        expect(n.isComponent({ type, style: {}, children: [] })).to.be.true
      })
    })
    it('should automatically return false if the value isnt an object type', () => {
      expect(n.isComponent(null)).to.be.false
      expect(n.isComponent(undefined)).to.be.false
      expect(n.isComponent('button')).to.be.false
      expect(n.isComponent('listItem')).to.be.false
      expect(n.isComponent({ listItem: 'hello' })).to.be.false
      expect(n.isComponent([{ type: 'button', style: {} }])).to.be.false
    })
  })

  describe('isEmitObj', () => {
    it('should return true', () => {
      expect(n.isEmitObj({ emit: { dataKey: 'f', actions: [] } })).to.be.true
    })
    it('should return false', () => {
      expect(n.isEmitObj({ emift: { dataKey: 'f', actions: [] } })).to.be.false
    })
  })

  describe('isIfObj', () => {
    it('should return true', () => expect(n.isIfObj({ if: [] })).to.be.true)
    it('should return false', () => expect(n.isIfObj({ iff: [] })).to.be.false)
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
    it('should return true for dots', () => {
      expect(n.isReference('.fafs')).to.be.true
    })
    it('should return true for @', () => {
      expect(n.isReference('@.fafafs')).to.be.true
    })
    it('should return true for =', () => {
      expect(n.isReference('=')).to.be.true
    })
  })
})
